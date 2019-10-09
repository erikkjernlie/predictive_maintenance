import React, { useState, useEffect } from "react";
import "./Navbar.css";
import { Link } from "react-router-dom";
import messages from "../../messages";

const Navbar = props => {
  const [selectedPage, setSelectedPage] = useState("Logo");

  const handleClick = page => {
    if (selectedPage === page) {
      return;
    }
    setSelectedPage(page);
  };

  return (
    <div className="NavbarWrapper">
      <div className={"NavElement " + (selectedPage === "/" && "Selected")}>
        <Link to="/">ML</Link>
      </div>

      <div
        className={
          "NavElement " + (selectedPage === "/newProject" && "Selected")
        }
      >
        <Link to="/newProject">
          <img src="add.svg" color="white" />
        </Link>
      </div>
      <div
        className={"NavElement " + (selectedPage === "/projects" && "Selected")}
      >
        <Link to="/projects">
          <img src="list.svg" color="white" />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
