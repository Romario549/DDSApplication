import React, { useState, useEffect } from 'react';
import { cashflowAPI } from '../services/api';

const ReferenceManagement = () => {
  const [activeTab, setActiveTab] = useState('statuses');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [categoryForSubcategory, setCategoryForSubcategory] = useState('');

  const [data, setData] = useState({
    statuses: [],
    types: [],
    categories: [],
    subcategories: []
  });

  const [loading, setLoading] = useState(false);

  // Загрузка данных
  const loadData = async () => {
    setLoading(true);
    try {
      const [statusesRes, typesRes, categoriesRes, subcategoriesRes] = await Promise.all([
        cashflowAPI.getStatuses(),
        cashflowAPI.getTypes(),
        cashflowAPI.getCategories(),
        cashflowAPI.getSubcategories(),
      ]);

      setData({
        statuses: statusesRes.data.results || statusesRes.data,
        types: typesRes.data.results || typesRes.data,
        categories: categoriesRes.data.results || categoriesRes.data,
        subcategories: subcategoriesRes.data.results || subcategoriesRes.data,
      });
    } catch (error) {
      console.error('Error loading references:', error);
      alert('Ошибка загрузки справочников');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Обработчики форм
  const handleCreate = async () => {
    try {
      let response;
      switch (activeTab) {
        case 'statuses':
          response = await cashflowAPI.createStatus(formData);
          break;
        case 'types':
          response = await cashflowAPI.createType(formData);
          break;
        case 'categories':
          response = await cashflowAPI.createCategory(formData);
          break;
        case 'subcategories':
          if (!categoryForSubcategory) {
            alert('Выберите категорию');
            return;
          }
          response = await cashflowAPI.createSubcategory({
            ...formData,
            category: categoryForSubcategory
          });
          break;
        default:
          return;
      }
      
      setShowForm(false);
      setFormData({ name: '', description: '' });
      setCategoryForSubcategory('');
      loadData();
      alert('Запись успешно создана!');
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Ошибка создания записи');
    }
  };

  const handleUpdate = async () => {
    try {
      let response;
      switch (activeTab) {
        case 'statuses':
          response = await cashflowAPI.updateStatus(editingItem.id, formData);
          break;
        case 'types':
          response = await cashflowAPI.updateType(editingItem.id, formData);
          break;
        case 'categories':
          response = await cashflowAPI.updateCategory(editingItem.id, formData);
          break;
        case 'subcategories':
          response = await cashflowAPI.updateSubcategory(editingItem.id, {
            ...formData,
            category: categoryForSubcategory || editingItem.category
          });
          break;
        default:
          return;
      }
      
      setShowForm(false);
      setEditingItem(null);
      setFormData({ name: '', description: '' });
      setCategoryForSubcategory('');
      loadData();
      alert('Запись успешно обновлена!');
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Ошибка обновления записи');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      try {
        switch (activeTab) {
          case 'statuses':
            await cashflowAPI.deleteStatus(id);
            break;
          case 'types':
            await cashflowAPI.deleteType(id);
            break;
          case 'categories':
            await cashflowAPI.deleteCategory(id);
            break;
          case 'subcategories':
            await cashflowAPI.deleteSubcategory(id);
            break;
          default:
            return;
        }
        
        loadData();
        alert('Запись успешно удалена!');
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Ошибка удаления записи');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || ''
    });
    if (activeTab === 'subcategories') {
      setCategoryForSubcategory(item.category);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ name: '', description: '' });
    setCategoryForSubcategory('');
  };

  // Функция для получения заголовка по ключу таба
  const getTitle = (tabKey) => {
    const titles = {
      statuses: 'Статусы',
      types: 'Типы операций',
      categories: 'Категории',
      subcategories: 'Подкатегории'
    };
    return titles[tabKey] || 'Справочник';
  };

  const getCurrentData = () => data[activeTab];

  return (
    <div className="reference-management">
      <h1>📚 Управление справочниками</h1>

      {/* Табы - передаем ключ таба в getTitle */}
      <div className="tabs">
        {['statuses', 'types', 'categories', 'subcategories'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {getTitle(tab)} {/* Передаем tab как параметр */}
          </button>
        ))}
      </div>

      {/* Заголовок - используем activeTab напрямую */}
      <div className="reference-header">
        <h2>{getTitle(activeTab)}</h2> {/* Передаем activeTab как параметр */}
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Добавить
        </button>
      </div>

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {editingItem ? 'Редактирование' : 'Добавление'} {getTitle(activeTab).toLowerCase()}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              editingItem ? handleUpdate() : handleCreate();
            }}>
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  placeholder="Введите описание..."
                />
              </div>

              {activeTab === 'subcategories' && (
                <div className="form-group">
                  <label>Категория *</label>
                  <select
                    value={categoryForSubcategory}
                    onChange={(e) => setCategoryForSubcategory(e.target.value)}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {data.categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseForm}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Таблица данных */}
      <div className="reference-table">
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Описание</th>
                {activeTab === 'subcategories' && <th>Категория</th>}
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentData().map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.description || '-'}</td>
                  {activeTab === 'subcategories' && (
                    <td>
                      {data.categories.find(cat => cat.id === item.category)?.name || item.category}
                    </td>
                  )}
                  <td>
                    <button 
                      className="btn btn-edit"
                      onClick={() => handleEdit(item)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn btn-delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {getCurrentData().length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'subcategories' ? 5 : 4} className="no-data">
                    Нет записей
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ReferenceManagement;