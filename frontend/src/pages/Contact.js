// import React from "react";
// import { Helmet } from "react-helmet";
// import ContactForm from "../components/ContactForm";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faPhone,
//   faEnvelope,
//   faLocationDot,
//   faClock,
// } from "@fortawesome/free-solid-svg-icons";

// const Contact = () => {
//   return (
//     <div className="contact-page" style={styles.contactPage}>
//       <Helmet>
//         <title>
//           Contact | Lawyer Kanjirappally | Legal Consulting Office Lex Net
//         </title>
//         <meta
//           name="description"
//           content="Contact us for any legal issues you may be facing. We offer consultancy and representation in various legal fields. Location: Bucharest, Hours: Monday - Friday: 9 AM - 5 PM, Email: av_alinamarin@yahoo.com, Phone: +40769 935 716."
//         />
//       </Helmet>
//       <section>
//         <h6 className="guide-text ms-3 mt-4">CONTACT</h6>
//         {/* Contact info */}
//         <div className="container-lg bg-light my-5 shadow">
//           <div className="contact-info text-center py-5">
//             <div className="row no-gutters">
//               <div className="col-lg-3 col-md-6 col-12 border-end border-1">
//                 <div className="contact-inner" style={styles.contactInner}>
//                   <div className="info-i">
//                     <span>
//                       <FontAwesomeIcon
//                         icon={faLocationDot}
//                         size="2x"
//                         className="law-icon pb-3"
//                       />
//                     </span>
//                   </div>
//                   <h5>Location:</h5>
//                   <p>Kanjirappally</p>
//                 </div>
//               </div>
//               <div className="col-lg-3 col-md-6 col-12 border-end border-1">
//                 <div className="contact-inner" style={styles.contactInner}>
//                   <div className="info-i">
//                     <span>
//                       <FontAwesomeIcon
//                         icon={faClock}
//                         size="2x"
//                         className="law-icon pb-3"
//                       />
//                     </span>
//                   </div>
//                   <h5>Hours:</h5>
//                   <p>Monday – Friday: 9 AM – 5 PM</p>
//                 </div>
//               </div>
//               <div className="col-lg-3 col-md-6 col-12 border-end border-1">
//                 <div className="contact-inner" style={styles.contactInner}>
//                   <div className="info-i">
//                     <span>
//                       <FontAwesomeIcon
//                         icon={faEnvelope}
//                         size="2x"
//                         className="law-icon pb-3"
//                       />
//                     </span>
//                   </div>
//                   <h5>Email:</h5>
//                   <p>alex@gmail.com</p>
//                 </div>
//               </div>
//               <div className="col-lg-3 col-md-6 col-12">
//                 <div className="contact-inner" style={styles.contactInner}>
//                   <div className="info-i">
//                     <span>
//                       <FontAwesomeIcon
//                         icon={faPhone}
//                         size="2x"
//                         className="law-icon pb-3"
//                       />
//                     </span>
//                   </div>
//                   <h5>Phone:</h5>
//                   <p>+91 1034 4655 655</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//         {/* Contact form and text */}
//         <div className="container-lg">
//           <div className="row g-5">
//             <div className="col-sm-6 order-sm-first ">
//               <div className="contact-text d-flex flex-column" style={styles.contactText}>
//                 <h5 className="lh-base text-center pb-4">
//                   Do not hesitate to contact us!
//                 </h5>
//                 <p>
//                   We are here to provide support for all the legal issues you
//                   are facing.
//                 </p>
//                 <p>
//                   Please contact us by filling out the form below, and we will
//                   be happy to assist you.
//                 </p>
//                 <p>
//                   We will process your request and get back to you shortly with
//                   more details.
//                 </p>
//               </div>
//             </div>
//             <div className="col-sm-6 ">
//               <ContactForm />
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// // Styles for the Contact component
// const styles = {
//   contactPage: {
//     backgroundColor: '#f8f9fa', // Light background for the entire page
//     padding: '20px', // Padding for overall spacing
//   },
//   contactInner: {
//     padding: '10px', // Padding inside contact info blocks
//   },
//   contactText: {
//     padding: '20px', // Padding for text section
//     backgroundColor: '#ffffff', // White background for contrast
//     borderRadius: '5px', // Slight rounding of corners
//     boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)', // Shadow for depth
//   }
// };

// export default Contact;
