import { Search } from 'lucide-react';
import { useSearch } from '../store/search';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SearchBar() {
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && location.pathname !== '/catalog') {
      navigate('/catalog');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Rediriger vers le catalogue dès qu'on commence à taper
    if (value.trim() && location.pathname !== '/catalog') {
      navigate('/catalog');
    }
  };

  return (
    <div className="search">
      <form onSubmit={handleSearch}>
        <input 
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Rechercher un produit..."
        />
        <Search className="search-icon" size={20} />
      </form>
    </div>
  );
}