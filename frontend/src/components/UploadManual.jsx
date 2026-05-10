import { useState } from "react";
import { Upload } from "lucide-react";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;  

function UploadManual() {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        type: "",
        description: "",
        amount: "",
        due_date: ""
    });

    
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        }).format(value);
    };

    async function handleDrop(e) {
        e.preventDefault();
        const uploadedFile = e.dataTransfer.files[0];
        setFile(uploadedFile);
        const formData = new FormData();
        formData.append("invoice", uploadedFile);
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(
            `${BACKEND_API_URL}/upload/manual-invoice`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            }
        );
        const data = await res.json();
        setParsedData(data);
        setForm({
            type: "",
            description: "",
            amount: data.amount || "",
            due_date: formatDateForInput(data.due_date) || ""
        });
        setLoading(false);
        setDragging(false);
    };

    async function handleSave() {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${BACKEND_API_URL}/events/manual`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(form)
                }
            );
            if (!res.ok) {
                throw new Error("Error guardando factura");
            }
            setParsedData(null);
            setForm({
                type: "",
                description: "",
                amount: "",
                due_date: ""
            });
        } catch (error) {
            console.log(error);
        } finally {
            setFile(null);
        }
    };

    function formatDateForInput(dateStr) {
        if (!dateStr) return "";

        const [day, month, year] = dateStr.split("/");

        return `${year}-${month}-${day}`;
    };


  return (
    <>
        {loading && (
        <div className="loadingOverlay">
            <div className="spinner"></div>
            <p>Procesando factura...</p>
        </div>
        )}

        <div className="card">
            <h3>Si te llegó una factura por fuera de Gmail y querés
            cargar sus datos automáticamente, arrastrala acá.</h3>

            <div className={`uploadDropzone ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}>

                <Upload size={60} />

                <h2>Arrastrá tu factura acá</h2>

            </div>

            {parsedData && (
            <>
                <h3>{file?.name}</h3>
                <div className="formInputRow">
                    <label>Nombre:</label>
                    <input placeholder="ej.: Factura de Claro" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}/>
                </div>

                <div className="formInputRow">
                    <label>Descripción:</label>
                    <input placeholder="ej.: Celu Valen" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}/>
                </div>

                <div className="formInputRow">
                    <label>Monto:</label>
                    <input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})}/>
                    <small>{formatCurrency(form.amount)}</small>
                </div>

                <div className="formInputRow">
                    <label>Fecha de vencimiento:</label>
                    <input type="date" value={form.due_date} onChange={(e) => setForm({...form, due_date: e.target.value})}/>
                </div>

                <button onClick={handleSave}>
                    Guardar factura
                </button>
            </>
            )}
        </div>
    </>
    
    )
};

export default UploadManual;