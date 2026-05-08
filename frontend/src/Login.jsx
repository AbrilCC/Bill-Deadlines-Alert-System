import { useState } from "react";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

function Auth() {
    const [isLogin, setIsLogin] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const endpoint = isLogin
        ? `${BACKEND_API_URL}/auth/login`
        : `${BACKEND_API_URL}/auth/register`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error);
                return;
            }
            localStorage.setItem("token", data.token);
            alert(
                isLogin
                    ? "Inición sesiada ✅"
                    : "Cuenta creada ✅"
            );

        } catch (error) {
            status(500).json({error: error.message});
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card" id="formStyle">

            <h2>
                {isLogin
                    ? "Iniciar sesión"
                    : "Crear cuenta"}
            </h2>

            <div className="formInputRow">
                <label>Correo</label>

                <input
                    type="email"
                    placeholder="ej: juan@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="formInputRow">
                <label>Contraseña</label>
                <input
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button type="submit" disabled={loading}>
                {isLogin
                    ? "Ingresar"
                    : "Crear cuenta"}
            </button>

            <p
                style={{
                    marginTop: "16px",
                    cursor: "pointer",
                    color: "#df6b17",
                    "text-decoration": "underline"
                }}
                onClick={() => setIsLogin(!isLogin)}
            >
                {
                    isLogin
                    ? "¿No tenés cuenta? Registrate"
                    : "¿Ya tenés cuenta? Iniciar sesión"
                }
            </p>

        </form>
    );
}

export default Auth;