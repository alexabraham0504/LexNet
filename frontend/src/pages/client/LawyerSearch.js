// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import Footer from "../../components/footer/footer-client";
// import Navbar from "../../components/navbar/navbar-client";

// const LawyerSearch = () => {
//   const [verifiedLawyers, setVerifiedLawyers] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   useEffect(() => {
//     fetchVerifiedLawyers();
//   }, []);

//   const fetchVerifiedLawyers = async () => {
//     try {
//       // Use GET request to fetch verified lawyers
//       const response = await axios.get("http://localhost:5000/api/verified");
//       console.log("All verified lawyers:", response.data); // Log response to check

//       // Filter lawyers who have isVerified set to true and are active
//       const filteredLawyers = response.data.filter(
//         (lawyer) => lawyer.isVerified === true && lawyer.isActive === true
//       );

//       // Set the filtered lawyers to the state
//       setVerifiedLawyers(filteredLawyers);
//     } catch (error) {
//       console.error("Error fetching verified lawyers:", error);
//     }
//   };

//   // Filter lawyers by search term (case-insensitive)
//   const filteredLawyers = verifiedLawyers.filter(
//     (lawyer) =>
//       lawyer.fullname &&
//       lawyer.fullname.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div>
//       <Navbar />

//       <div className="search-lawyers-container">
//         <div className="search-box">
//           <h1>Find Verified Lawyers</h1>
//           <input
//             type="text"
//             placeholder="Search Lawyers..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         {/* Verified Lawyers Table */}
//         <div className="table-container">
//           <table className="lawyer-table">
//             <thead>
//               <tr>
//                 <th>Profile Picture</th>
//                 <th>Name</th>
//                 <th>Specialization</th>
//                 <th>Location</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredLawyers.map((lawyer) => (
//                 <tr key={lawyer._id}>
//                   <td>
//                     {lawyer.profilePicture ? (
//                       <img
//                         src={`http://localhost:5000/uploads/${lawyer.profilePicture}`}
//                         alt="Profile"
//                         className="profile-picture"
//                       />
//                     ) : (
//                       "No Image"
//                     )}
//                   </td>
//                   <td>{lawyer.fullname}</td>
//                   <td>{lawyer.specialization}</td>
//                   <td>{lawyer.location}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <style jsx>{`
//           .search-lawyers-container {
//             max-width: 1200px;
//             margin: 0 auto;
//             padding: 40px;
//             text-align: center;
//           }

//           .search-box {
//             margin-bottom: 30px;
//           }

//           h1 {
//             font-size: 2.2em;
//             color: #333;
//             margin-bottom: 20px;
//           }

//           input {
//             padding: 12px;
//             width: 60%;
//             max-width: 500px;
//             border-radius: 30px;
//             border: 1px solid #ddd;
//             font-size: 1em;
//             box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//             margin-bottom: 20px;
//           }

//           input:focus {
//             outline: none;
//             border: 1px solid #007bff;
//             box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
//           }

//           .table-container {
//             overflow-x: auto;
//           }

//           .lawyer-table {
//             width: 100%;
//             border-collapse: collapse;
//             margin-top: 20px;
//             border-radius: 10px;
//             overflow: hidden;
//             box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//           }

//           th,
//           td {
//             padding: 14px;
//             text-align: center;
//             border-bottom: 1px solid #ddd;
//             font-size: 1em;
//           }

//           th {
//             background-color: #007bff;
//             color: white;
//           }

//           tr:nth-child(even) {
//             background-color: #f9f9f9;
//           }

//           tr:hover {
//             background-color: #f1f1f1;
//           }

//           .profile-picture {
//             width: 50px;
//             height: 50px;
//             border-radius: 50%;
//             object-fit: cover;
//           }

//           @media screen and (max-width: 768px) {
//             input {
//               width: 90%;
//             }

//             th,
//             td {
//               padding: 10px;
//             }
//           }
//         `}</style>
//       </div>

//       <Footer />
//     </div>
//   );
// };

// export default LawyerSearch;



import React, { useEffect, useState } from "react";
import axios from "axios";
import Footer from "../../components/footer/footer-client";
import Navbar from "../../components/navbar/navbar-client";

const LawyerSearch = () => {
  const [verifiedLawyers, setVerifiedLawyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVerifiedLawyers();
  }, []);

  const fetchVerifiedLawyers = async () => {
    try {
      // Use GET request to fetch verified lawyers
      const response = await axios.get("http://localhost:5000/api/verified");
      console.log("All verified lawyers:", response.data); // Log response to check

      // Filter lawyers who have isVerified set to true and are active
      const filteredLawyers = response.data.filter(
        (lawyer) => lawyer.isVerified === true && lawyer.isActive === true
      );

      // Set the filtered lawyers to the state
      setVerifiedLawyers(filteredLawyers);
    } catch (error) {
      console.error("Error fetching verified lawyers:", error);
    }
  };

  // Filter lawyers by search term (case-insensitive)
  const filteredLawyers = verifiedLawyers.filter(
    (lawyer) =>
      lawyer.fullname &&
      lawyer.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Navbar />

      <div className="search-lawyers-container">
        <div className="search-box">
          <h1>Find Verified Lawyers</h1>
          <input
            type="text"
            placeholder="Search Lawyers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Verified Lawyers Table */}
        <div className="table-container">
          <table className="lawyer-table">
            <thead>
              <tr>
                <th>Profile Picture</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredLawyers.map((lawyer) => (
                <tr key={lawyer._id}>
                  <td>
                    {lawyer.profilePicture ? (
                      <img
                        src={`http://localhost:5000/uploads/${lawyer.profilePicture}`}
                        alt="Profile"
                        className="profile-picture"
                      />
                    ) : (
                      <img
                        src="/images/default-profile.png"
                        alt="No Profile"
                        className="profile-picture"
                      />
                    )}
                  </td>
                  <td>{lawyer.fullname}</td>
                  <td>{lawyer.specialization}</td>
                  <td>{lawyer.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <style jsx>{`
          .search-lawyers-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px;
            text-align: center;
          }

          .search-box {
            margin-bottom: 30px;
          }

          h1 {
            font-size: 2.2em;
            color: #333;
            margin-bottom: 20px;
          }

          input {
            padding: 12px;
            width: 60%;
            max-width: 500px;
            border-radius: 30px;
            border: 1px solid #ddd;
            font-size: 1em;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
          }

          input:focus {
            outline: none;
            border: 1px solid #007bff;
            box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
          }

          .table-container {
            overflow-x: auto;
          }

          .lawyer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          th,
          td {
            padding: 14px;
            text-align: center;
            border-bottom: 1px solid #ddd;
            font-size: 1em;
          }

          th {
            background-color: #007bff;
            color: white;
          }

          tr:nth-child(even) {
            background-color: #f9f9f9;
          }

          tr:hover {
            background-color: #f1f1f1;
          }

          .profile-picture {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
          }

          @media screen and (max-width: 768px) {
            input {
              width: 90%;
            }

            th,
            td {
              padding: 10px;
            }
          }
        `}</style>
      </div>

      <Footer />
    </div>
  );
};

export default LawyerSearch;
