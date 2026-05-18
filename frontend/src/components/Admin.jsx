import { useEffect, useState } from "react";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

export default function Admin() {
    const [data, setData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [editType, setEditType] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [customPaymentMethod, setCustomPaymentMethod] = useState("");

    const PAYMENT_METHODS = [
        "💵 Efectivo",
        "📱 Mercado Pago",
        "💳 Tarjeta de débito",
        "💳 Tarjeta de crédito",
        "🏛️Transferencia bancaria",
        "Otro..."
    ];
    
    async function fetchData() {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${BACKEND_API_URL}/admin/services`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const json = await res.json();
            console.log(json);
            setData(json);
        } catch (error) {
            console.log(error);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedItem) {
            setEditType(selectedItem.type || "");
            setEditDescription(selectedItem.description || "");
            setEditAmount(selectedItem.amount || "");
            setPaymentMethod(selectedItem.payment_method || "");
        }
    }, [selectedItem]);

    async function saveChanges() {
        const token = localStorage.getItem("token");
        const itemId = selectedItem.rule_id || selectedItem.id;
        const endpoint =
            selectedType === "rule"
            ? `${BACKEND_API_URL}/rules/${itemId}`
            : `${BACKEND_API_URL}/events/${itemId}`;

        await fetch(endpoint, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                type: editType,
                description: editDescription,
                amount: editAmount,
                due_date: selectedItem.due_date,
                preferred_days: selectedItem.preferred_days || [],
                payment_method:
                    paymentMethod === "Otro..."
                    ? customPaymentMethod
                    : paymentMethod
            })
        });

        await fetchData();
    };

    async function deleteService() {
        const token = localStorage.getItem("token");
        const itemId = selectedItem.rule_id || selectedItem.id;
        const endpoint =
            selectedType === "rule"
            ? `${BACKEND_API_URL}/rules/${itemId}`
            : `${BACKEND_API_URL}/events/${itemId}`;

        await fetch(endpoint, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        await fetchData();
        setModalOpen(false);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
        }).format(value || 0);
    };

        
    if (!data) {
        return (
            <div className="card" style={{"width": "50%", "textAlign": "center"}}>
                No tenés vencimientos cargados, empezá agregando algunos o conectá tu Gmail para importarlos automáticamente.
            </div>)
    } else {
    return(
        <div>
            <div className="adminPage">

                <div className="adminSection">
                    <h2 className="adminSectionTitle">Servicios de pago único:</h2>                    
                    <div className="adminGrid">
                        {data.single.map(event => (
                            <div key={event.id} className="adminCard"
                            onClick={() => {setSelectedItem(event); setSelectedType("event"); setModalOpen(true);}}>
                                <h4>{event.type}</h4>
                                <p>{event.description}</p>
                                <p>{formatCurrency(event.amount)}</p>
                                <div className="paymentTag">
                                    {event.payment_method || <h4>Sin método de pago seleccionado</h4>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="adminSection">
                    <h2 className="adminSectionTitle">Servicios semanales:</h2>
                    <div className="adminGrid">
                        {data.weekly.map(rule => (
                            <div key={rule.id} className="adminCard"
                            onClick={() => {setSelectedItem(rule); setSelectedType("rule"); setModalOpen(true);}}>
                                <h4>{rule.type}</h4>
                                <p>{rule.description}</p>
                                <p>{formatCurrency(rule.amount)}</p>
                                <div className="paymentTag">
                                    {rule.payment_method || <h4>Sin método de pago seleccionado</h4>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                <div className="adminSection">
                    <h2 className="adminSectionTitle">Servicios mensuales:</h2>
                    <div className="adminGrid">
                        {data.monthly.map(rule => (
                            <div key={rule.id} className="adminCard"
                            onClick={() => {setSelectedItem(rule); setSelectedType("rule"); setModalOpen(true);}}>
                                <h4>{rule.type}</h4>
                                <p>{rule.description}</p>
                                <p>{formatCurrency(rule.amount)}</p>
                                <div className="paymentTag">
                                    {rule.payment_method || <h4>Sin método de pago seleccionado</h4>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="adminSection">
                    <h2 className="adminSectionTitle">Servicios importados desde Gmail:</h2>
                    <div className="adminGrid">
                        {data.gmail.map(event => (
                            <div key={event.id} className="adminCard"
                            onClick={() => {setSelectedItem(event); setSelectedType("event"); setModalOpen(true);}}>
                                <h4>{event.type}</h4>
                                <p>{event.description}</p>
                                <p>{formatCurrency(event.amount)}</p>
                                <div className="paymentTag">
                                    {event.payment_method || <h4>Sin método de pago seleccionado</h4>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {modalOpen && selectedItem && (
                <div className="modalOverlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <button className="closeBtn" 
                        onClick={() => {setModalOpen(false); setSelectedItem(null); setEditing(false)}}>X</button>

                        {editing ? (
                            <>
                            <input value={editType} onChange={(e) => setEditType(e.target.value)}/>

                            <input value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}/>

                            <input type="number" value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}/>

                            <label>Método de pago</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                <option value="">
                                    Seleccionar método de pago
                                </option>
                                {PAYMENT_METHODS.map(method => (
                                    <option key={method} value={method}>
                                        {method}
                                    </option>
                                ))}
                            </select>
                            {paymentMethod === "Otro..." && (
                                <input type="text" placeholder="Agregá otro método de pago" 
                                value={customPaymentMethod} onChange={(e) => setCustomPaymentMethod(e.target.value)}/>
                            )}

                            <div className="tooltipWrapper">
                                <button onClick={saveChanges}>
                                    Guardar cambios
                                </button>
                            </div>
                        </>
                        ) : (
                        <>
                            <h2>{selectedItem.type}</h2>
                            <p style={{"fontSize": "20px"}}>{selectedItem.description}</p>
                            <p style={{"fontSize": "20px"}}>Monto: {formatCurrency(selectedItem.amount)}</p>
                            
                            <div className="paymentTag">
                                {selectedItem.payment_method || <h3>Tocá Editar para seleccionar un método de pago</h3>}
                            </div>
                            <div className="tooltipWrapper">
                                <button onClick={() => setEditing(true)}>
                                    Editar
                                </button>
                                <span className="tooltipText">
                                    Modificá el nombre, descripción, actualizá el precio del servicio, o agregá un método de pago.
                                </span>
                            </div>
                            
                        </>)}

                        <div className="adminModalButtons">
                            <div className="tooltipWrapper">
                                <button onClick={deleteService}
                                style={{"background": "#971e1e", "color": "white"}}>
                                    Borrar este servicio
                                </button>
                                <span className="tooltipText">
                                    Elimina todos los vencimientos relacionados a este servicio. Esta acción no se puede deshacer. Deberás volver a crearlo manualmente o importarlo desde Gmail.
                                </span>
                            </div>
                            

                            <button onClick={() => setModalOpen(false)}>
                                Cerrar
                            </button>

                        </div>

                    </div>

                </div>
            )}
        </div>
    )
    }
};