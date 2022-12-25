import MessiNFT from 0xf8d6e0586b0a20c7
import NonFungibleToken from 0xf8d6e0586b0a20c7

// Our transaction object now takes in arguments!
transaction(
    recipient: Address,
    name: String,
    description: String,
    thumbnail: String,
) {
  prepare(signer: AuthAccount) {
    // Check if the user sending the transaction has a collection
    if signer.borrow<&MessiNFT.Collection>(from: MessiNFT.CollectionStoragePath) != nil {
        // If they do, we move on to the execute stage
        return
    }

    // If they don't, we create a new empty collection
    let collection <- MessiNFT.createEmptyCollection()

    // Save it to the account
    signer.save(<-collection, to: MessiNFT.CollectionStoragePath)

    // Create a public capability for the collection
    signer.link<&{NonFungibleToken.CollectionPublic}>(
        MessiNFT.CollectionPublicPath,
        target: MessiNFT.CollectionStoragePath
    )
  }


  execute {
    // Borrow the recipient's public NFT collection reference
    let receiver = getAccount(recipient)
        .getCapability(MessiNFT.CollectionPublicPath)
        .borrow<&{NonFungibleToken.CollectionPublic}>()
        ?? panic("Could not get receiver reference to the NFT Collection")

    // Mint the NFT and deposit it to the recipient's collection
    MessiNFT.mintNFT(
        recipient: receiver,
        name: name,
        description: description,
        thumbnail: thumbnail,
    )
    
    log("Minted an NFT and stored it into the collection")
  } 
}

