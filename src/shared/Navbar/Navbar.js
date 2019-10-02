import React from "react";
import "./Navbar.css";
import { Link } from "react-router-dom";
import messages from "../../messages";
import { setLocale } from "../../utils/locale";

const Navbar = props => {
  return (
    <div className="NavbarWrapper">
      {" "}
      <Link to="/dashboard">{messages.Home}</Link>
      <div onClick={setLocale("nb")}>CHANGE</div>
    </div>
  );
};

export default Navbar;
