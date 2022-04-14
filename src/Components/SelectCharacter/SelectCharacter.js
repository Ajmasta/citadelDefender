import React, { useEffect, useState } from "react";
import "./SelectCharacter.css";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import MyEpicGame from "../../utils/MyEpicGame.json";
import LoadingIndicator from "../LoadingIndicator";
/*
 * Don't worry about setCharacterNFT just yet, we will talk about it soon!
 */
const SelectCharacter = ({ setCharacterNFT }) => {
  const [characters, setCharacters] = useState([]);
  const [gameContract, setGameContract] = useState(null);
  const [mintingCharacter, setMintingCharacter] = useState(false);
  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        MyEpicGame.abi,
        signer
      );

      /*
       * This is the big difference. Set our gameContract in state.
       */
      setGameContract(gameContract);
    } else {
      console.log("Ethereum object not found");
    }
  }, []);
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const charactersTxn = await gameContract.getAllDefaultCharacters();

        const characters = charactersTxn.map((characterData) =>
          transformCharacterData(characterData)
        );
        setCharacters(characters);
      } catch (error) {
        console.log(error);
      }
    };
    const onCharacterMint = async (sender, tokenId, characterIndex) => {
      console.log(
        `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
      );
      if (gameContract) {
        setCharacterNFT(characters[characterIndex]);
        console.log(characters);
      }
    };
    if (gameContract && characters) {
      fetchCharacters();
      gameContract.on("CharacterNFTMinted", onCharacterMint);
    }
    return () => {
      if (gameContract) {
        gameContract.off("CharacterNFTMinted", onCharacterMint);
      }
    };
  }, [gameContract, characters]);

  const mintCharacterNFTAction = async (characterId) => {
    setMintingCharacter(true);

    try {
      if (gameContract) {
        console.log("Minting character in progress...");
        const mintTxn = await gameContract.mintCharacterNFT(characterId);
        await mintTxn.wait();
        console.log("mintTxn:", mintTxn);
        setMintingCharacter(false);
      }
    } catch (error) {
      console.warn("MintCharacterAction Error:", error);
      setMintingCharacter(false);
    }
  };
  return (
    <div className="select-character-container">
      {mintingCharacter ? (
        <div className="loading">
          <div className="indicator">
            <LoadingIndicator />
            <p>Minting In Progress...</p>
          </div>
          <img
            src="https://media2.giphy.com/media/61tYloUgq1eOk/giphy.gif?cid=ecf05e47dg95zbpabxhmhaksvoy8h526f96k4em0ndvx078s&rid=giphy.gif&ct=g"
            alt="Minting loading indicator"
          />
        </div>
      ) : (
        <>
          <h2>Mint Your Hero. Choose wisely.</h2>
          <div className="character-grid">
            {characters.map((character, index) => (
              <div className="character-item" key={character.name}>
                <div className="name-container">
                  <p>{character.name}</p>
                </div>
                <img
                  src={`https://cloudflare-ipfs.com/ipfs/${character.imageURI}`}
                  alt={character.name}
                />
                <button
                  type="button"
                  className="character-mint-button"
                  onClick={() => mintCharacterNFTAction(index)}
                >{`Mint ${character.name}`}</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SelectCharacter;
