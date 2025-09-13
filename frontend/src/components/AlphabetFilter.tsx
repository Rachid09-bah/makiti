import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AlphabetFilter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentLetter = searchParams.get('letter');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleLetterClick = (letter: string) => {
    const params = new URLSearchParams(searchParams);
    if (currentLetter === letter) {
      params.delete('letter');
    } else {
      params.set('letter', letter);
    }
    navigate(`/catalog?${params.toString()}`);
  };

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('letter');
    navigate(`/catalog?${params.toString()}`);
  };

  return (
    <div className="alphabet-filter">
      <div className="alphabet-header">
        <span className="text-sm font-medium text-slate-600">Filtrer par lettre :</span>
        {currentLetter && (
          <button 
            onClick={clearFilter}
            className="text-xs text-orange-600 hover:text-orange-800 ml-2"
          >
            Effacer
          </button>
        )}
      </div>
      <div className="alphabet-grid">
        {alphabet.map((letter) => (
          <button
            key={letter}
            onClick={() => handleLetterClick(letter)}
            className={`alphabet-btn ${currentLetter === letter ? 'active' : ''}`}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}