import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Plus, Edit, Trash2, Tags } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
}

async function fetchCategories() {
  const res = await api.get('/categories');
  return res.data as Category[];
}

async function createCategory(data: { name: string; slug: string }) {
  const res = await api.post('/categories', data);
  return res.data;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '' });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: fetchCategories
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowForm(false);
      setFormData({ name: '', slug: '' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.slug) {
      createMutation.mutate(formData);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      name,
      slug: generateSlug(name)
    });
  };

  return (
    <div className="admin-categories-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Gestion des catégories</h1>
          <p>Organisez vos produits par catégories</p>
        </div>
        <div className="page-actions">
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <Tags size={20} />
          </div>
          <div className="stat-content">
            <h3>{categories.length}</h3>
            <p>Catégories totales</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="table-container" style={{ marginBottom: '16px' }}>
          <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 16px' }}>Nouvelle catégorie</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Leppi & Tenues traditionnelles"
                  className="search-input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="leppi-tenues"
                  className="search-input"
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary"
              >
                {createMutation.isPending ? 'Création...' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-outline"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>Chargement...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Slug</th>
                <th>Date de création</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tags size={16} style={{ color: '#64748b' }} />
                      <strong>{category.name}</strong>
                    </div>
                  </td>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                      {category.slug}
                    </code>
                  </td>
                  <td>{new Date(category.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className="actions">
                      <button className="action-btn edit" title="Modifier">
                        <Edit size={14} />
                      </button>
                      <button className="action-btn delete" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}