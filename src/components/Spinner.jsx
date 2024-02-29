import spinner from "../assets/svg/spinner.svg";

export default function Spinner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div>
        <img src={spinner} alt="Cargando..." className="h-24" />
      </div>
    </div>
  );
}
