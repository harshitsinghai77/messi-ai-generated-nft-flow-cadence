import MessiNFT from 0xf8d6e0586b0a20c7

transaction {
    prepare(acct: AuthAccount){
        acct.save(<- MessiNFT.createCollection(), to: /storage/MessiNFT)

        // We're linking two resources in different storage domains
        acct.link<&MessiNFT.Collection{MessiNFT.CollectionPublic}>
        (/public/MessiNFT, target: /storage/MessiNFT)
    }

    execute{
        log("MessiNFT Collection created")
    }
}
 