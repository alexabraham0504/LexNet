import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, userType }) => {
  const location = useLocation();
  const storedUserType = sessionStorage.getItem("userType");
  const userId = sessionStorage.getItem(`${userType}Id`);

  if (!userId || storedUserType !== userType) {
    return (
      <Navigate to={`/${userType}/login`} state={{ from: location.pathname }} />
    );
  }

  return children;
};

export default ProtectedRoute;
