const ethers = require('ethers')
const express = require('express')

const IERC20ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function decimals() public view returns (uint8)"
]

const USDT_ADDRESS = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f"

const {
    ETH_URL,
    TARGET_WALLET,
    TARGET_HOOK
} = process.env

const provider = new ethers.JsonRpcProvider(ETH_URL)
const wallet = ethers.getAddress(TARGET_WALLET)

const contract = new ethers.Contract(USDT_ADDRESS, IERC20ABI, provider)

const filter = contract.filters.Transfer([], [wallet])

contract.decimals().then(decimals => {
    contract.on(filter, async event => {
        const [from, to, value] = event.args
        console.log(`POST to ${TARGET_HOOK}`)
        try {
            await fetch(`${TARGET_HOOK}`, {
                method: "POST",
                headers: {
                    authorization: "Bearer felipe",
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    hash: event.log.transactionHash,
                    block: event.log.blockNumber,
                    datetime: (await provider.getBlock(event.log.blockNumber)).date,
                    from,
                    to,
                    value: ethers.formatUnits(value, decimals),
                    coin: "USDT"
                })
            })
        } catch (err) {
            console.error('it broke', err)
        }
    })
})
