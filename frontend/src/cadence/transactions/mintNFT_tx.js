export const mintNFT = `
import MessiNFT2 from 0x70f20757a526c9de

import NonFungibleToken from 0x631e88ae7f1d7c20
import MetadataViews from 0x631e88ae7f1d7c20

transaction(
  recipient: Address,
  name: String,
  description: String,
  thumbnail: String,
) {
  prepare(signer: AuthAccount) {
    if signer.borrow<&MessiNFT2.Collection>(from: MessiNFT2.CollectionStoragePath) != nil {
      return
    }

    // Create a new empty collection
    let collection <- MessiNFT2.createEmptyCollection()

    // save it to the account
    signer.save(<-collection, to: MessiNFT2.CollectionStoragePath)

    // create a public capability for the collection
    signer.link<&{NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection}>(
      MessiNFT2.CollectionPublicPath,
      target: MessiNFT2.CollectionStoragePath
    )
  }


  execute {
    // Borrow the recipient's public NFT collection reference
    let receiver = getAccount(recipient)
      .getCapability(MessiNFT2.CollectionPublicPath)
      .borrow<&{NonFungibleToken.CollectionPublic}>()
      ?? panic("Could not get receiver reference to the NFT Collection")

    // Mint the NFT and deposit it to the recipient's collection
    MessiNFT2.mintNFT(
      recipient: receiver,
      name: name,
      description: description,
      thumbnail: thumbnail,
    )
    
    log("Minted an NFT and stored it into the collection")
  } 
}
`;
