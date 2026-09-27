import { useParams } from "react-router-dom";

// A geração real do PDF (seções 39-41) acontece via /api/reports — este é
// só o placeholder da tela enquanto o gerador de PDF não está implementado.
export default function Report() {
  const { gameId } = useParams<{ gameId: string }>();

  async function handleGenerate() {
    const res = await fetch(`/api/reports/generate?game_id=${gameId}`, { credentials: "include" });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      alert("Geração de relatório em PDF ainda não implementada.");
    }
  }

  return (
    <div>
      <h1>Relatório da partida</h1>
      <button className="btn btn-primary" onClick={handleGenerate}>
        GERAR / BAIXAR PDF
      </button>
    </div>
  );
}
