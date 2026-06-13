import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "../config/api";

const SharePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const backendUrl = getApiBaseUrl();
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
              "Make sure the deployed backend URL is configured and reachable."
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
