import React from "react";
import styles from "./Footer.module.css";
import github from "../static/github-favicon.png";

interface Props {}

const Footer: React.FC<Props> = () => {
  return (
    <div className={styles.component}>
      <img src={github} className={styles.image} alt="github" />
      <a href="https://github.com/joelaghina/Multi-Signature-Wallet" target="__blank">
        Code
      </a>
    </div>
  );
};

export default Footer;
