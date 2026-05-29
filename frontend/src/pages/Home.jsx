import React from 'react';
import About from '../components/About/About.jsx';
import Historia from '../components/Historia/Historia.jsx';
import Products from '../components/Products/Products.jsx';
import Opinions from '../components/Opinions/Opinions.jsx';
import JobWithUs from '../components/JobWithUs/JobWithUs.jsx';

export default function Home() {
  return (
    <>
      <About />
      <Historia />
      <Products />
      <Opinions />
      <JobWithUs />
    </>
  );
}
