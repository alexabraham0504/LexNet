const LawyerVerification = () => {
    const [lawyers, setLawyers] = useState([]);
  
    useEffect(() => {
      axios.get('/api/lawyers/pending').then((response) => setLawyers(response.data));
    }, []);
  
    const handleApprove = (lawyerId) => {
      axios.put(`/api/lawyers/approve/${lawyerId}`).then(() => {
        setLawyers(lawyers.filter((lawyer) => lawyer.id !== lawyerId));
      });
    };
  
    return (
      <div>
        <h2>Pending Lawyer Verifications</h2>
        <ul>
          {lawyers.map((lawyer) => (
            <li key={lawyer.id}>
              {lawyer.name} - {lawyer.expertise}
              <button onClick={() => handleApprove(lawyer.id)}>Approve</button>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default LawyerVerification;
  