// ...existing code...
import React from 'react';
import Navbar from './components/NavBar/Navbar.jsx';
import About from './components/About/About.jsx';
import Products from './components/Products/Products.jsx';
import Opinions from './components/Opinions/Opinions.jsx';
import JobWithUs from './components/JobWithUs/JobWithUs.jsx';
import Footer from './components/Footer/Footer.jsx';
import './App.css'; 

export default function App() {
  return (
    <>
      <Navbar />
      <About />
      <Products />
      <Opinions />
      <JobWithUs />
      <Footer />
    </>
  );
}