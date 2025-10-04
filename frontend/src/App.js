import React, { useState, useEffect } from 'react';
import { cashflowAPI } from './services/api';
import NoteForm from './components/NoteForm';
import ReferenceManagement from './components/ReferenceManagement'; 
import './styles.css';

function App() {
  const [currentPage, setCurrentPage] = useState('notes');
  const [notes, setNotes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
    type: '',
    category: '',
    subcategory: '',
  });

  useEffect(() => {
    loadReferences();
    if (currentPage === 'notes') {
      loadNotes();
    }
  }, [currentPage]);


  const loadReferences = async () => {
    try {
      const [statusesRes, typesRes, categoriesRes, subcategoriesRes] = await Promise.all([
        cashflowAPI.getStatuses(),
        cashflowAPI.getTypes(),
        cashflowAPI.getCategories(),
        cashflowAPI.getSubcategories(),
      ]);

      setStatuses(statusesRes.data.results || statusesRes.data);
      setTypes(typesRes.data.results || typesRes.data);
      setCategories(categoriesRes.data.results || categoriesRes.data);
      setSubcategories(subcategoriesRes.data.results || subcategoriesRes.data);
    } catch (error) {
      console.error('Error loading references:', error);
      alert('Ошибка загрузки справочников');
    }
  };

  const loadNotes = async (customFilters = filters) => {
    setLoading(true);
    try {
      const response = await cashflowAPI.getNotes(customFilters);
      setNotes(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading notes:', error);
      alert('Ошибка загрузки записей');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await cashflowAPI.createNote(data);
      setShowForm(false);
      loadNotes();
      alert('Запись успешно создана!');
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Ошибка создания записи');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await cashflowAPI.updateNote(id, data);
      setShowForm(false);
      setEditingNote(null);
      loadNotes();
      alert('Запись успешно обновлена!');
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Ошибка обновления записи');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      try {
        await cashflowAPI.deleteNote(id);
        loadNotes();
        alert('Запись успешно удалена!');
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Ошибка удаления записи');
      }
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadNotes(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters = {
      start_date: '',
      end_date: '',
      status: '',
      type: '',
      category: '',
      subcategory: '',
    };
    setFilters(emptyFilters);
    loadNotes(emptyFilters);
  };

  const handleEdit = async (note) => {
    try {
      setLoading(true);

      const response = await cashflowAPI.getNote(note.id);
      setEditingNote(response.data);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading note details:', error);
      alert('Ошибка загрузки данных записи');

      setEditingNote(note);
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingNote(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="nav-buttons">
          <button 
            className={`nav-btn ${currentPage === 'notes' ? 'active' : ''}`}
            onClick={() => setCurrentPage('notes')}
          >
            📊 Записи
          </button>
          <button 
            className={`nav-btn ${currentPage === 'references' ? 'active' : ''}`}
            onClick={() => setCurrentPage('references')}
          >
            📚 Справочники
          </button>
        </div>
        
        <h1>💰 Учет Движения Денежных Средств</h1>
        
        {currentPage === 'notes' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Новая запись
          </button>
        )}
      </header>

      {currentPage === 'notes' && (
        <>
          {showForm && (
            <NoteForm
              note={editingNote}
              statuses={statuses}
              types={types}
              categories={categories}
              subcategories={subcategories}
              onSubmit={editingNote ? handleUpdate : handleCreate}
              onCancel={handleCloseForm}
            />
          )}

          <div className="filters">
            <h3>Фильтры</h3>
            <div className="filter-row">
              <div className="filter-group">
                <label>Дата с:</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Дата по:</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Статус:</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Все</option>
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Тип:</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">Все</option>
                  {types.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Категория:</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Все</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-secondary" onClick={resetFilters}>
                Сбросить
              </button>
            </div>
          </div>

          <div className="note-list">
            <h3>Список операций</h3>
            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : (
              <table className="note-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Статус</th>
                    <th>Тип</th>
                    <th>Категория</th>
                    <th>Подкатегория</th>
                    <th>Сумма</th>
                    <th>Комментарий</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map(note => (
                    <tr key={note.id}>
                      <td>{note.formatted_date}</td>
                      <td>{note.status_name}</td>
                      <td>
                        <span className={`badge ${note.type_name === 'Пополнение' ? 'badge-income' : 'badge-expense'}`}>
                          {note.type_name}
                        </span>
                      </td>
                      <td>{note.category_name}</td>
                      <td>{note.subcategory_name}</td>
                      <td className={note.type_name === 'Пополнение' ? 'amount-income' : 'amount-expense'}>
                        {note.formatted_amount} ₽
                      </td>
                      <td>{note.comment || '-'}</td>
                      <td>
                        <button 
                          className="btn btn-edit"
                          onClick={() => handleEdit(note)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-delete"
                          onClick={() => handleDelete(note.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {notes.length === 0 && (
                    <tr>
                      <td colSpan="8" className="no-data">
                        Нет записей. Создайте первую запись!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      
      {currentPage === 'references' && (
        <ReferenceManagement />
      )}
    </div>
  );
}

export default App;