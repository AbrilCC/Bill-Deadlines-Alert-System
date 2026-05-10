import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

function Auth() {
    const [isLogin, setIsLogin] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [forgotMode, setForgotMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const endpoint = forgotMode
        ? `${BACKEND_API_URL}/auth/forgot-password`
        : isLogin
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
                body: JSON.stringify(
                    forgotMode
                        ? { email }
                        : { email, password }
                )
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error);
                return;
            }
            localStorage.setItem("token", data.token);
            window.location.reload();
            alert(
                isLogin
                    ? "Inición sesiada ✅"
                    : "Cuenta creada ✅"
            );

        } catch (error) {
            console.error(error);
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

            {!forgotMode && (
            <div className="formInputRow">
                <label>Contraseña</label>
                <div className="passwordInputContainer">
                    <input type={showPassword ? "text" : "password"}
                        placeholder="Debe tener un mínimo de 8 caracteres e incluir 1 letra y 1 número."
                        value={password} onChange={(e) => setPassword(e.target.value)}/>

                    <button type="button" className="showPasswordBtn" onClick={() => setShowPassword(!showPassword)}>
                        {
                            showPassword
                                ? <EyeOff size={20} />
                                : <Eye size={20} />
                        }
                    </button>
                </div>
            </div>)}

            <button type="submit" disabled={loading}>
                {isLogin
                    ? "Ingresar"
                    : "Crear cuenta"}
            </button>

            <p style={{
                    marginTop: "16px",
                    cursor: "pointer",
                    color: "#df6b17",
                    "text-decoration": "underline"
                }} onClick={() => setIsLogin(!isLogin)}>
                {
                    isLogin
                    ? "¿No tenés cuenta? Registrate"
                    : "¿Ya tenés cuenta? Iniciar sesión"
                }
            </p>

            <p style={{
                    marginTop: "16px",
                    cursor: "pointer",
                    color: "#df6b17"
                }} onClick={() => setForgotMode(!forgotMode)}>
            Olvidé mi contraseña
            </p>

        </form>
    );
}

export default Auth;