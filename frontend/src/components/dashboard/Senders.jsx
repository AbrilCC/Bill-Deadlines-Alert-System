import { useState } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  AlertTriangle
} from "lucide-react";

function Senders({trustedSenders, setTrustedSenders}) {
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const missingTrustedSenders = trustedSenders.length === 0;

  const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

  async function handleDelete(index) {
    const updated = trustedSenders.filter((_, i) => i !== index);
    setTrustedSenders(updated);
    await saveTrustedSenders(updated);
  }

  function handleEdit(index) {
    setEditingIndex(index);
    setEditingValue(trustedSenders[index]);
  }

  async function saveEdit() {
    const updated = [...trustedSenders];
    updated[editingIndex] = editingValue;
    setTrustedSenders(updated);
    await saveTrustedSenders(updated);

    setEditingIndex(null);
    setEditingValue("");
  }

  function addSender() {
    setTrustedSenders([
      ...trustedSenders,
      ""
    ]);
    setEditingIndex(trustedSenders.length);
    setEditingValue("");
  }

  const saveTrustedSenders = async (updatedSenders) => {
    const token = localStorage.getItem("token");
    await fetch(
      `${BACKEND_API_URL}/dashboard/senders`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sendersArray: updatedSenders
        })
      }
    );
  };
  

  return (
    <>
      <div className="dashboardCard" onClick={() => setShowModal(true)} style={{ cursor: "pointer" }}>
        <div className="checklistHeader">
          <h3>Remitentes de facturas</h3>
        </div>
        {missingTrustedSenders && (<AlertTriangle size={18} color="#ff9800" />)}

        <p>Para evitar cargar datos de phishing y publicidad, configurá las direcciones de mails de tus servicios.</p>
      </div>

      {showModal && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>

          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <h2 className="checklistHeader">Mis remitentes confiables:</h2>

            {trustedSenders.map((sender, index) => (

              <div key={index} className="senderBox"
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "10px"
                }}>
                {editingIndex === index ? 
                  (<input value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}/>

                  ) : (<div style={{ flex: 1 }}>{sender}</div>
                  )}

                {editingIndex === index ?
                  (<button onClick={saveEdit}>Guardar</button>
                  ) : (
                    <button onClick={() => handleEdit(index)}>
                      <Pencil size={18} />
                    </button>
                  )}

                <button onClick={() => handleDelete(index)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button onClick={addSender} className="addSenderBtn">
              <Plus size={18} />
              Agregar otro mail...
            </button>

          </div>
        </div>
      )}
    </>
  );
}

export default Senders;