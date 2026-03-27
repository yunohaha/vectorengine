import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../style.css'; 


const NavBar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <h1>VectorEngine</h1>
        </div>
        
        <div className="navbar-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            Галерея
          </Link>
          <Link 
            to="/editor/new" 
            className={location.pathname.includes('/editor') ? 'active' : ''}
          >
            Новый проект
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;