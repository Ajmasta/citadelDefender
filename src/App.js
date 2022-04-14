import React, { useEffect, useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import SelectCharacter from "./Components/SelectCharacter/SelectCharacter";
import { CONTRACT_ADDRESS, transformCharacterData } from "./constants";
import MyEpicGame from "./utils/MyEpicGame.json";
import { ethers } from "ethers";
import Arena from "./Components/Arena/Arena";
import LoadingIndicator from "./Components/LoadingIndicator";

const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [currentAcc, setAcc] = useState("");
  const [characterNFT, setCharacterNFT] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [players, setPlayers] = useState(null);
  const checkNetwork = async () => {
    try {
      if (window.ethereum.networkVersion !== "4") {
        alert("Please connect to Rinkeby");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Make sure you have Metamask!");
        return;
      } else {
        console.log("object", ethereum);
        console.log("window", window);
        const accounts = await ethereum.request({ method: "eth_accounts" });
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setAcc(account);
          checkNetwork();
        } else {
          console.log("No authorized account Found");
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const connectWalletAction = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get Metamask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("connected", accounts[0]);
      setAcc(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    const fetchNFTMetadata = async () => {
      console.log("Checking for NFT on ", currentAcc);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        MyEpicGame.abi,
        signer
      );
      console.log("gameContract", gameContract);
      console.log(currentAcc);
      const txn = await gameContract.checkIfUserHadNFT();
      const allPlayersTxn = await gameContract.getAllPlayers();
      setPlayers(allPlayersTxn);
      const damagePlayers = await gameContract.getDamageOfPlayer(
        allPlayersTxn[0]
      );
      console.log("damagePlayers", damagePlayers.toNumber());
      if (txn.name) {
        console.log("User has Character NFT");
        setCharacterNFT(transformCharacterData(txn));
      } else {
        console.log("No Character NFT found. ");
      }
      setIsLoading(false);
    };
    if (currentAcc) {
      console.log("CurrentAccount:", currentAcc);
      fetchNFTMetadata();
    }
  }, [currentAcc]);

  useEffect(() => {
    setIsLoading(true);

    checkIfWalletIsConnected();
  }, []);
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">⚔️ Citadel Defender ⚔️</p>
          <p className="sub-text">Team up to protect the Citadel!</p>

          <div className="connect-wallet-container"></div>
          {currentAcc}
          {isLoading ? (
            <LoadingIndicator />
          ) : !currentAcc ? (
            <button
              className="cta-button connect-wallet-button"
              onClick={connectWalletAction}
            >
              Connect!
            </button>
          ) : !characterNFT ? (
            <SelectCharacter setCharacterNFT={setCharacterNFT} />
          ) : (
            <Arena
              characterNFT={characterNFT}
              setCharacterNFT={setCharacterNFT}
            />
          )}
        </div>
        <div>
          <h3 style={{ color: "white" }}>List of All Players</h3>
          {players?.map((player) => (
            <p style={{ color: "white" }}>{player}</p>
          ))}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
