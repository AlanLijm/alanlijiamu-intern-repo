import { useState, useEffect } from "react";

function UserProfile() {
    const [user,setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() =>{
        fetch('api/user')
        .then((response) => response.json())
        .then((data) => setUser(data))
        .catch((err) => setError(err.message));      
    }, []);

    if(error){
        return <p>Load failed: {error}</p>;
    }

    if(!user){
        return <p>Loading...</p>
    }
    return <p data-testid="user-name">userName:{user.name}</p>;
}

export default UserProfile;