import { Construction, ArrowLeft } from "lucide-react";

const WorkInProgress = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-950 border-gray-100">
      <div className="relative mb-6 group">
        <div className="relative bg-white p-4 rounded-full shadow-sm ring-1 ring-gray-100 inline-flex items-center justify-center">
          <Construction className="w-10 h-10 text-blue-600" strokeWidth={1.5} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Nog even geduld!</h2>
      <p className="text-gray-500 max-w-md mb-8">We zijn momenteel hard aan het werk om deze pagina te bouwen. Kom binnenkort terug voor het resultaat.</p>

      <div className="flex gap-4">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all focus:ring-4 focus:ring-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Ga terug
        </button>
      </div>
    </div>
  );
};

export default WorkInProgress;
