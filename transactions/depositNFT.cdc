
import MessiNFT from "../contracts/MessiNFT.cdc"

transaction {
    prepare(acct: AuthAccount){
        let collectionReference = 
            acct.borrow<&MessiNFT.Collection>(from: /storage/MessiNFT)
                ?? panic("No collection found!")

        collectionReference.deposit(token: <- MessiNFT.mintNFT())
    }

    execute{
        log("MessiNFT Collection created")
    }
}
 