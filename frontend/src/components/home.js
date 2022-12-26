import { useRef, useEffect, useState, useContext } from "react";

import ClipLoader from "react-spinners/ClipLoader";
import * as fcl from "@onflow/fcl";
import * as types from "@onflow/types";

import { store } from "../store/store";
import { SET_MINTED_IMAGES } from "../store/types";
import { mintNFT } from "../cadence/transactions/mintNFT_tx";
import {
  getTotalSupply,
  getMetadata,
  getIDs,
} from "../cadence/scripts/get_script";
import messiVideo from "../video/messi.mp4";
import Wallpaper from "../video/wallpaper.webp";

fcl.config({
  "flow.network": "testnet",
  "app.detail.title": "MessiNFT",
  "accessNode.api": "https://rest-testnet.onflow.org",
  "app.detail.icon":
    "https://pbs.twimg.com/profile_images/1605165438911909888/US5jCHM3_400x400.jpg",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
});

const HomeComponents = ({ handleClick }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;

  const [user, setUser] = useState();
  const [loading, setLoading] = useState(false);
  const [testnetLink, setTestnetLink] = useState("");
  const [nftAvailable, setNftAvailable] = useState(true);
  const [nftAlreadyMinted, setNftAlreadyMinted] = useState(false);

  const logIn = () => {
    fcl.authenticate();
  };

  const logOut = () => {
    dispatch({
      type: SET_MINTED_IMAGES,
      payload: [],
    });

    fcl.unauthenticate();
  };

  const fetchNFTs = async () => {
    // Empty the images array
    dispatch({
      type: SET_MINTED_IMAGES,
      payload: [],
    });

    let IDs = [];

    // Fetch the IDs with our script (no fees or signers necessary)
    try {
      IDs = await fcl.query({
        cadence: `${getIDs}`,
        args: (arg, t) => [arg(user.addr, types.Address)],
      });
    } catch (err) {
      console.log("No NFTs Owned");
    }

    let _imageSrc = [];
    try {
      for (let i = 0; i < IDs.length; i++) {
        const result = await fcl.query({
          cadence: `${getMetadata}`,
          args: (arg, t) => [
            arg(user.addr, types.Address),
            arg(IDs[i].toString(), types.UInt64),
          ],
        });
        // If the source is an IPFS link, remove the "ipfs://" prefix
        if (result["thumbnail"].startsWith("ipfs://")) {
          _imageSrc.push(result["thumbnail"].substring(7));
          // Add a gateway prefix
          _imageSrc[i] = "https://nftstorage.link/ipfs/" + _imageSrc[i];
        } else {
          _imageSrc.push(result["thumbnail"]);
        }
      }
    } catch (err) {
      console.log("No Nfts found");
    }

    if (_imageSrc.length > 0) {
      setNftAlreadyMinted(true);
      dispatch({
        type: SET_MINTED_IMAGES,
        payload: _imageSrc,
      });
    }
  };

  async function getMessiNFTIPFS() {
    try {
      const response = await fetch("https://nemo-thread.deta.dev/messiNFT");
      const data = await response.json();

      // check length of data and if at 0, then return 0 index
      if (data["ipfs_hash"].length > 0) {
        return data["ipfs_hash"][0]["ipfsURL"];
      }
      return null;
    } catch (error) {
      console.error(error);
    }
  }

  const mint = async () => {
    if (nftAlreadyMinted) return;

    setLoading(true);
    let _totalSupply;
    try {
      _totalSupply = await fcl.query({
        cadence: `${getTotalSupply}`,
      });
    } catch (err) {
      console.log(err);
    }

    const _id = parseInt(_totalSupply) + 1;

    let ipfs_hash = await getMessiNFTIPFS();
    if (ipfs_hash == null) {
      setNftAvailable(false);
      return;
    }

    try {
      const transactionId = await fcl.mutate({
        cadence: `${mintNFT}`,
        args: (arg, t) => [
          arg(user.addr, types.Address), //address to which the NFT should be minted
          arg("MessiNFT # " + _id.toString(), types.String), // Name
          arg("Limited Edition AI Generated MessiNFT on Flow", types.String), // Description
          arg(ipfs_hash, types.String),
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        limit: 99,
      });

      setTestnetLink(
        `https://testnet.flowscan.org/transaction/${transactionId}`
      );

      await fcl.tx(transactionId).onceSealed();
      alert("NFT minted successfully!");
    } catch (error) {
      console.log(error);
      alert("Error minting NFT, please check the console for error details!");
    }

    setLoading(false);
    window.location.reload();
  };

  useEffect(() => {
    // This listens to changes in the user objects
    // and updates the connected user
    fcl.currentUser().subscribe(setUser);
  }, []);

  useEffect(() => {
    if (user && user.addr) {
      fetchNFTs();
    }
  }, [user]);

  const RenderLogout = () => {
    if (user && user.addr) {
      return (
        <div
          onClick={() => logOut()}
          className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white-900 rounded-lg border border-gray-300 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800 cursor-pointer"
        >
          Logout {user.addr.substring(0, 6)}...
          {user.addr.substring(user.addr.length - 4)}
          <svg
            className="ml-2 -mr-1 w-5 h-5"
            fill="white"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
      );
    }
  };

  const RenderLogin = () => (
    <div
      onClick={() => logIn()}
      className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900 cursor-pointer"
    >
      Get Started
      <svg
        className="ml-2 -mr-1 w-5 h-5"
        fill="white"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
          clipRule="evenodd"
        ></path>
      </svg>
    </div>
  );

  const scrollToTheBottom = () => {
    // Get the maximum scrollable height of the page
    const maxScrollHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );

    // Scroll to the bottom of the page
    window.scroll({
      top: maxScrollHeight,
      behavior: "smooth",
    });
  };

  const MintNFTButton = () => {
    if (nftAlreadyMinted) {
      return (
        <button
          onClick={scrollToTheBottom}
          className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900 cursor-pointer"
        >
          You already have a Messi NFT! Scroll down to see it
        </button>
      );
    }

    if (nftAvailable) {
      return (
        <button
          onClick={() => mint()}
          className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900 cursor-pointer"
        >
          Mint AI Generated Messi NFT 🐐🐐🐐
          <ClipLoader
            color="ffffff"
            loading={loading}
            size={20}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </button>
      );
    }

    return (
      <button
        disabled
        className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-gray-400 hover:bg-gray-500 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-900 cursor-not-allowed"
      >
        All unique Messi NFTs have been minted. Sorry, no NFT available to mint.
        :)
      </button>
    );
  };

  return (
    <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-white md:text-5xl lg:text-6xl dark:text-white">
        Get your own AI Generated MessiNFT 🐐
      </h1>
      <p className="mb-8 text-lg font-normal text-white-800 lg:text-xl sm:px-16 xl:px-48 dark:text-white-400">
        Experience the future of art with our AI generated Messi NFTs on Flow.
        Created using Stable Diffusion and Dreambooth, these limited edition
        NFTs are truly unique. Get yours before they're all gone!
      </p>
      <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
        {user && user.addr ? <RenderLogout /> : <RenderLogin />}

        {user && user.addr && <MintNFTButton />}

        <div
          onClick={handleClick}
          className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white-900 rounded-lg border border-gray-300 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800 cursor-pointer"
        >
          <svg
            className="mr-2 -ml-1 w-5 h-5"
            fill="white"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
          </svg>
          Unmute Video
        </div>
      </div>
      {testnetLink && (
        <a href={testnetLink} target="_blank" rel="noreferrer">
          <div className="mb-5 px-4 mx-auto text-center md:max-w-screen-md lg:max-w-screen-lg lg:px-36">
            <span className="font-semibold text-white-400">
              Testnet explorer link {testnetLink}
            </span>
          </div>
        </a>
      )}
      <a
        href="https://twitter.com/harshit_778"
        target="_blank"
        rel="noreferrer"
      >
        <div className="px-4 mx-auto text-center md:max-w-screen-md lg:max-w-screen-lg lg:px-36">
          <span className="font-semibold text-white-400 uppercase">
            Follow me on Twitter
          </span>
        </div>
      </a>
    </div>
  );
};

const Home = () => {
  const videoRef = useRef(null);
  const globalState = useContext(store);
  const { mintedImages } = globalState.state;

  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const toggleVideoMute = () => {
    if (videoRef.current.muted) {
      videoRef.current.muted = false;
    } else {
      videoRef.current.muted = true;
    }
  };

  useEffect(() => {
    const videoElement = new Audio();
    videoElement.src = messiVideo;
    videoElement.oncanplay = () => setIsVideoLoaded(true);
  }, []);

  const RenderMintedImages = () => {
    return (
      <div className="flex flex-col items-center justify-center mb-10">
        <h1 className="mb-8 text-2xl font-extrabold tracking-tight leading-none text-blue-500 md:text-3xl lg:text-5xl dark:text-blue-500">
          Your AI Generated MessiNFT 🐐
        </h1>

        <div className="flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center justify-center w-full h-full p-4 overflow-hidden transition duration-500 ease-in-out transform bg-white rounded-lg shadow-xl hover:-translate-y-1 hover:scale-110 dark:bg-gray-800">
            <img src={mintedImages[0]} alt="Minted NFT" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="relative flex items-center justify-center h-screen mb-12 overflow-hidden">
        <div className="relative z-30 p-5 text-white  bg-opacity-50 rounded-xl">
          <HomeComponents handleClick={toggleVideoMute} />
        </div>
        {isVideoLoaded ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            className="absolute z-10 w-auto min-w-full min-h-full max-w-none"
            src={messiVideo}
          />
        ) : (
          <img
            src={Wallpaper}
            alt="NFT  Wallpaper"
            className="absolute z-10 w-auto min-w-full min-h-full max-w-none"
          />
        )}
      </header>

      {mintedImages.length > 0 && <RenderMintedImages />}
    </>
  );
};

export default Home;
