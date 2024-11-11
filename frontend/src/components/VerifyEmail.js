import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/auth/verify/${token}`
        );
        const data = await response.data;
        alert(data.message);
        if (data.message === "Email verified successfully.") {
          navigate("/login");
        }
      } catch (error) {
        alert("Verification failed.");
      }
    };
    verifyToken();
  }, [token, navigate]);

  return (
    <div>
      <h2>Verifying Email...</h2>
    </div>
  );
};

export default VerifyEmail;
