import { useState } from "react";
import { Eye, EyeOff, ArrowBigLeft } from "lucide-react";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

function Auth() {
    const [mode, setMode] = useState("register");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const endpoint = 
        mode === "forgot"
            ? `${BACKEND_API_URL}/auth/forgot-password`
            : mode === "login"
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
                    mode === "forgot"
                        ? { email }
                        : { email, password }
                )
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error);
                return;
            };
            if (mode === "forgot") {
                alert("Te enviamos un mail para recuperar tu contraseña");
                setMode("login");
                return;
            };

            // For Login / Register
            localStorage.setItem("token", data.token);
            alert(
                mode === "login"
                    ? "Inición sesiada ✅"
                    : "Cuenta creada ✅"
            );
            window.location.reload();

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card" id="formStyle">

            <h2> {
                    mode === "forgot"
                        ? "Recuperar contraseña"
                        : mode === "login"
                            ? "Iniciar sesión"
                            : "Crear cuenta"
                }
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

            {mode !== "forgot" && (
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
                {mode === "forgot"
                    ? "Enviar mail"
                    : mode === "login"
                        ? "Ingresar"
                        : "Crear cuenta"}
            </button>

            {mode !== "forgot" && (
            <>
                <p style={{
                    marginTop: "16px",
                    cursor: "pointer",
                    color: "#df6b17",
                    "text-decoration": "underline"}} onClick={() => setMode(mode === "login" ? "register" : "login")}>
                    {mode === "login"
                        ? "¿No tenés cuenta? Registrate"
                        : "¿Ya tenés cuenta? Iniciar sesión"}
                </p>
                <p style={{ 
                    marginTop: "16px",
                    cursor: "pointer",
                    color: "#df6b17"}} onClick={() => {setMode("forgot"); setPassword("")}}>
                    Olvidé mi contraseña</p>
            </>)}

            {mode === "forgot" && (
                <button type="button" className="backToLoginBtn" onClick={() => setMode("login")}>
                    <ArrowBigLeft size={28} /> Volver al login
                </button>
            )}
        </form>
    );
}

export default Auth;