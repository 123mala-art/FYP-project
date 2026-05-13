import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const SharePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const backendUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
        const res = await fetch(`${backendUrl}/share/${id}`);
        const data = await res.json();
        if (data.error) {
          alert("Shared code not found or expired.");
          navigate("/");
        } else {
          // pass code into editor via navigate state
          navigate("/editor", { state: { shared: data } });
        }
      } catch (err) {
        alert("Failed to load shared code: " + err.message + "\n\n" +
              "Make sure the backend server is reachable from this device (same Wi‑Fi network, use LAN IP instead of localhost)."
        );
        navigate("/");
      }
    };
    fetchShare();
  }, [id, navigate]);

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-gray-600">Loading shared code...</p>
    </div>
  );
};

export default SharePage;
