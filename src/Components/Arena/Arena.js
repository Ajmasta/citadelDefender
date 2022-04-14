import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import myEpicGame from "../../utils/MyEpicGame.json";
import "./Arena.css";
import LoadingIndicator from "../LoadingIndicator";

/*
 * We pass in our characterNFT metadata so we can show a cool card in our UI
 */
const Arena = ({ characterNFT, setCharacterNFT }) => {
  // State
  const [gameContract, setGameContract] = useState(null);
  const [boss, setBoss] = useState(null);
  const [attackState, setAttackState] = useState(null);
  const [showToast, setShowToast] = useState(false);
  // UseEffects
  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );

      setGameContract(gameContract);
    } else {
      console.log("Ethereum object not found");
    }
  }, []);
  useEffect(() => {
    const fetchBoss = async () => {
      const bossTxn = await gameContract.getBigBoss();
      setBoss(transformCharacterData(bossTxn));
    };
    const AttackEmitted = (newBossHp, newPlayerHp) => {
      console.log(newBossHp, newPlayerHp);
      const bossHp = newBossHp.toNumber();
      const playerHp = newPlayerHp.toNumber();
      console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

      setBoss((prev) => {
        return { ...prev, hp: bossHp };
      });
      setCharacterNFT((prev) => {
        return { ...prev, hp: playerHp };
      });
    };
    if (gameContract) {
      fetchBoss();
      gameContract.on("AttackComplete", AttackEmitted);
    }
  }, [gameContract]);
  const runHealAction = async () => {
    const healTxn = await gameContract.healCharacters({
      value: ethers.utils.parseEther("0.001"),
    });
    await healTxn.wait();
    console.log("healed");
  };
  const runAttackAction = async () => {
    try {
      setAttackState("attacking");
      const attackTxn = await gameContract.attackBoss();
      await attackTxn.wait();
      console.log("AttackTxn", attackTxn);
      setAttackState("hit");

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } catch (error) {
      console.log(error);
      setAttackState("");
    }
  };
  return (
    <div className="arena-container">
      {/* Add your toast HTML right here */}
      {boss && characterNFT && (
        <div id="toast" className={showToast ? "show" : ""}>
          <div id="desc">{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
        </div>
      )}
      {boss && (
        <div className="boss-container">
          <div className={`boss-content ${attackState}`}>
            <h2>🔥 {boss.name} 🔥</h2>
            <div className="image-content">
              <img src={boss.imageURI} alt={`Boss ${boss.name}`} />
              <div className="health-bar">
                <progress value={boss.hp} max={boss.maxHp} />
                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
              </div>
            </div>
          </div>
          <div className="attack-container">
            <button className="cta-button" onClick={runAttackAction}>
              {`💥 Attack ${boss.name}`}
            </button>
          </div>
          {/* Add this right under your attack button */}
          {attackState === "attacking" && (
            <div className="loading-indicator">
              <LoadingIndicator />
              <p>Attacking ⚔️</p>
            </div>
          )}
        </div>
      )}
      {/* Replace your Character UI with this */}
      {characterNFT && (
        <div className="players-container">
          <div className="player-container">
            <h2>Your Character</h2>
            <div className="player">
              <div className="image-content">
                <h2>{characterNFT.name}</h2>
                <img
                  src={`https://cloudflare-ipfs.com/ipfs/${characterNFT.imageURI}`}
                  alt={`Character ${characterNFT.name}`}
                />
                <div className="health-bar">
                  <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                  <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                </div>
              </div>
              <div className="stats">
                <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
              </div>
            </div>
            <button
              className="cta-button"
              style={{ color: "black", marginTop: "10px" }}
              onClick={runHealAction}
            >
              Heal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Arena;
