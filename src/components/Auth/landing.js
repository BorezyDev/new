import React, { useState } from "react";
import "./landing.css";
import boy from "../../assets/boy.png"
import logo from "../../assets/Bore.jpg"
import emailjs from "emailjs-com";
import { FaAngleUp, FaAngleDown } from 'react-icons/fa'
import girrrl from "../../assets/contact_girl.png";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import bulb from "../../assets/light-bulb.png"
import vaisaki from "../../assets/performance.png"
import inventoryIcon from "../../assets/supplier.png"
import customerIcon from "../../assets/public-relation.png"
import realTimeIcon from "../../assets/24-hours-support.png"
import scalableIcon from "../../assets/energy-consumption.png"
import secureIcon from "../../assets/cyber-security.png"
import analyticsIcon from "../../assets/seo-report.png"
import { toast, ToastContainer } from 'react-toastify'; // Import react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for react-toastify
import { useNavigate } from 'react-router-dom';


function Landing() {

  const [activeIndex, setActiveIndex] = useState(null);
  const navigate = useNavigate();
  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => {
    console.log("Opening Modal");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log("Closing Modal");
    setIsModalOpen(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Collect form data
    const form = e.target;

    // Send the form data using EmailJS
    emailjs
      .sendForm(
        "service_9lslyi2", // Replace with your Service ID
        "template_uf95n4f", // Replace with your Template ID
        form,
        "14_ths1xYdpFcvGAU" // Replace with your Public Key
      )
      .then(
        (result) => {
          toast.success ("Your request has been sent successfully!");
          form.reset(); // Reset form fields
          handleCloseModal(); // Close modal after submission
        },
        (error) => {
          toast.error("There was an error sending your request. Please try again.");
          console.error("Error:", error);
        }
      );
  };
  const handleclicksign = () => {
    navigate('/Login');
  };
  return (
    <div className="App">
      <header className="navbar">
        <div><img src={logo} className="logo"></img></div>
        <nav >
          <a href="#hero">Home</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact us</a>
          <button className="sign-in" onClick={handleclicksign}>Sign In</button>
        </nav>
      </header>

      <section id="hero" className="hero">
        <div className="hero-content">
          <h1>Enhance Your Rental Business</h1>
          <p>
            Streamline your rental operations, enhance customer satisfaction,
            and boost conversions with our integrated solutions.
          </p>
          <button className="demo-button" onClick={handleOpenModal}>Take a demo</button>
        </div>
        <img
          src={boy}
          alt="Person using app"
          className="hero-image"
        />
      </section>
      {isModalOpen && (
        <div className="modal-overlay1">
          <div className="modal-content1">
            <button className="close-button" onClick={handleCloseModal}>
              &times;
            </button>
            <h2>Request a Demo</h2>
            <form className="demo-form" onSubmit={handleFormSubmit}>
              <input type="text" name="name" placeholder="Full name" required />
              <input type="text" name="buiseness name" placeholder="Business name" required />
              <input type="number" name="contact_number" className="cell" placeholder="Contact number" required />
              <input type="email" name="email" placeholder="Email Address" required />
              <button type="submit">Submit</button>
            </form>
          </div>
        </div>
      )}

      <section id="features" className="features">
        <h2>Features</h2>
        <div className="feature-cards">
          {[
            {
              title: "All-in-One Solution",
              description: "Manage every aspect of your rental business with a unified platform.",
              img: <img src={bulb} alt="Feature icon" />
            },
            {
              title: "Enhanced Efficiency",
              description: "Streamline operations to save time and maximize productivity.",
              img: <img src={vaisaki} alt="Feature icon" />
            },
            {
              title: "Inventory Optimization",
              description: "Track and manage inventory levels effortlessly to avoid shortages.",
              img: <img src={inventoryIcon} alt="Inventory icon" /> // Replace with the correct icon source
            },
            {
              title: "Customer-Centric Design",
              description: "Offer personalized experiences to boost customer satisfaction.",
              img: <img src={customerIcon} alt="Customer-centric icon" /> // Replace with the correct icon source
            },
            {
              title: "Real-Time Updates",
              description: "Access real-time data insights to make informed decisions instantly.",
              img: <img src={realTimeIcon} alt="Real-time updates icon" /> // Replace with the correct icon source
            },
            {
              title: "Scalable and Adaptable",
              description: "Grow your business seamlessly with our scalable solutions.",
              img: <img src={scalableIcon} alt="Scalable solutions icon" /> // Replace with the correct icon source
            },
            {
              title: "Reliable and Secure",
              description: "Ensure data security and reliability with advanced technology.",
              img: <img src={secureIcon} alt="Secure icon" /> // Replace with the correct icon source
            },
            {
              title: "Custom Reports and Analytics",
              description: "Generate tailored reports to analyze and enhance your performance.",
              img: <img src={analyticsIcon} alt="Analytics icon" /> // Replace with the correct icon source
            },
          ].map((feature, index) => (
            <div key={index} className="feature-card">
              {feature.img}
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>



      <section id="pricing" className="pricing">
        <h2>Subscription Packages</h2>
        <div className="pricing-cards">
          {[
            { name: "Start", price: "Free", users: "1 User", duration: "7 Days" },
            { name: "Basic", price: "₹300", users: "3 Users", duration: "7 Days" },
            { name: "Super", price: "₹1,100", users: "5 Users", duration: "30 Days" },
            { name: "Premium", price: "₹10,000", users: "5 Users", duration: "365 Days" },
          ].map((plan, index) => (
            <div key={index} className="pricing-card">
              <h5>{plan.name}</h5>
              <h3 className="price">{plan.price}</h3>
              <p>{plan.users}</p>
              <p>{plan.duration}</p>
              <button onClick={handleOpenModal}>{plan.name === "Start" ? "Take demo" : "Buy now"}</button>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="faq">
        <h2>Frequently Asked Questions</h2>
        {[
          {
            question: "What is Borezy?",
            answer: "Borezy is a platform to streamline rental operations, enhance customer satisfaction, and improve business efficiency.",
          },
          {
            question: "Who can use Borezy?",
            answer: "Any rental business, small or large, can benefit from Borezy's integrated solutions.",
          },
          {
            question: "How does Borezy handle inventory management?",
            answer: "Borezy provides real-time inventory tracking and updates to ensure stock levels are always optimized.",
          },
          {
            question: "Is Borezy suitable for large-scale businesses?",
            answer: "Yes, Borezy is highly scalable and can accommodate businesses of any size.",
          },
        ].map((faq, index) => (
          <div
            key={index}
            className={`faq-item ${activeIndex === index ? "active" : ""}`}
            onClick={() => toggleFAQ(index)}
          >
            <div className="faq-header">
              <h5>{faq.question}</h5>
              <span className="faq-icon">
                {activeIndex === index ? <FaAngleUp /> : <FaAngleDown />}
              </span>
            </div>
            {activeIndex === index && <p>{faq.answer}</p>}
          </div>
        ))}
      </section>



      <section id="contact" className="contact">
        <div className="contact-container">
          <div className="contact-image">
            <img src={girrrl} alt="Contact Us" />
          </div>
          <div className="contact-form">
            <h2>Contact Us</h2>
            <form onSubmit={handleFormSubmit}>
              <input type="text" name="name" placeholder="Name" />
              <input type="email" name="email" placeholder="Email" />
              <textarea name="message" placeholder="Message"></textarea>
              <button type="submit">Submit</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section company-info">
            <h3>About Us</h3>
            <p>Borezy helps rental businesses streamline operations, improve customer satisfaction, and drive efficiency.</p>
          </div>

          <div className="footer-section footer-links">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>

          <div className="footer-section contact-info">
            <h3>Contact Us</h3>
            <p>Email: support@borezy.com</p>
            <p>Phone: +91 9764767007</p>
            <p>Address: Borezy, Pune, India</p>
          </div>

          <div className="footer-section social-media">
            <h3>Follow Us</h3>
            <div className="social-icons">
              <a href="#" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href="#" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="#" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="#" aria-label="LinkedIn">
                <FaLinkedinIn />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>©️ 2024 Borezy. All Rights Reserved.</p>
        </div>
      </footer>
      <ToastContainer/>
    </div>
  );
}

export default Landing;
