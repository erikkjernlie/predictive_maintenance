import React, { useState } from "react";
import "./Navbar.css";
import { Link } from "react-router-dom";

const Navbar = props => {
  const [selectedPage, setSelectedPage] = useState("Logo");

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
          <img src="add.svg" color="white" alt="add" />
        </Link>
      </div>
      <div
        className={"NavElement " + (selectedPage === "/projects" && "Selected")}
      >
        <Link to="/projects">
          <img src="list.svg" color="white" alt="list" />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
