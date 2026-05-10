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
        }
    }, [selectedItem]);

    async function saveChanges() {
        const token = localStorage.getItem("token");
        const endpoint =
            selectedType === "rule"
            ? `${BACKEND_API_URL}/rules/${selectedItem.id}`
            : `${BACKEND_API_URL}/events/${selectedItem.id}`;

        await fetch(endpoint, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                type: editType,
                description: editDescription,
                amount: editAmount
            })
        });

        await fetchData();
    };

    async function deleteService() {
        const token = localStorage.getItem("token");
        const endpoint =
            selectedType === "rule"
            ? `${BACKEND_API_URL}/rules/${selectedItem.id}`
            : `${BACKEND_API_URL}/events/${selectedItem.id}`;

        await fetch(endpoint, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        await fetchData();
        setModalOpen(false);
    }

        
    if (!data) {
        return (
            <div className="card" style={{"width": "50%", "textAlign": "center"}}>
                No tenés vencimientos cargados, empezá agregando algunos o conectá tu Gmail para importarlos automáticamente.
            </div>)
    };

    return(
        <div>
            <div className="adminPage">
                <h2>Servicios de pago único:</h2>
                
                <div className="adminGrid">
                    {data.single.map(event => (
                        <div key={event.id} className="adminCard"
                        onClick={() => {setSelectedItem(event); setSelectedType("event"); setModalOpen(true);}}>
                            <h3>{event.type}</h3>
                            <p>{event.description}</p>
                            <p>{event.amount}</p>
                        </div>
                    ))}
                </div>

                <h2>Servicios semanales:</h2>

                <div className="adminGrid">
                    {data.weekly.map(rule => (
                        <div key={rule.rule_id} className="adminCard"
                        onClick={() => {setSelectedItem(rule); setSelectedType("rule"); setModalOpen(true);}}>
                            <h3>{rule.type}</h3>
                            <p>{rule.description}</p>
                            <p>{rule.amount}</p>
                        </div>
                    ))}
                </div>

                <h2>Servicios mensuales:</h2>

                <div className="adminGrid">
                    {data.monthly.map(rule => (
                        <div key={rule.rule_id} className="adminCard"
                        onClick={() => {setSelectedItem(rule); setModalOpen(true);}}>
                            <h3>{rule.type}</h3>
                            <p>{rule.description}</p>
                            <p>{rule.amount}</p>
                        </div>
                    ))}
                </div>

                <h2>Servicios importados desde Gmail:</h2>
                
                <div className="adminGrid">
                    {data.gmail.map(event => (
                        <div key={event.id} className="adminCard"
                        onClick={() => {setSelectedItem(event); setModalOpen(true);}}>
                            <h3>{event.type}</h3>
                            <p>{event.description}</p>
                            <p>{event.amount}</p>
                        </div>
                    ))}
                </div>
            </div>


            {modalOpen && selectedItem && (
                <div className="modal" onClick={() => setModalOpen(false)}>
                    <div className="modalOverlay" onClick={(e) => e.stopPropagation()}>
                        <button className="closeBtn" 
                        onClick={() => {setModalOpen(false); setSelectedItem(null); setEditing(false)}}>X</button>

                        {editing ? (
                            <>
                            <input value={editType} onChange={(e) => setEditType(e.target.value)}/>

                            <textarea value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}/>

                            <input type="number" value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}/>

                            <button onClick={saveChanges}>
                                Guardar cambios
                            </button>
                        </>
                        ) : (
                        <>
                            <h2>{selectedItem.type}</h2>
                            <p>{selectedItem.description}</p>
                            <p>${selectedItem.amount}</p>
                            <button onClick={() => setEditing(true)}>
                                Editar
                            </button>
                        </>)}

                        <div className="adminModalButtons">
                            <button onClick={deleteService}
                            style={{"background": "#971e1e", "color": "white"}}>
                                Borrar todas las notificaciones sobre este servicio
                            </button>

                            <button
                                onClick={() => setModalOpen(false)}
                            >
                                Cerrar
                            </button>

                        </div>

                    </div>

                </div>
            )}
        </div>
    )
};