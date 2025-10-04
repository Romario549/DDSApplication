import React, { useState, useEffect } from 'react';
import { cashflowAPI } from '../services/api';

const NoteForm = ({ note, statuses, types, categories, subcategories, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    created_date: '',
    status: '',
    type: '',
    category: '',
    subcategory: '',
    amount: '',
    comment: ''
  });
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Главный эффект для инициализации
  useEffect(() => {
    const initializeForm = async () => {
      if (note) {
        console.log('Initial note data:', note);
        
        const date = new Date(note.created_date);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);

        // Получаем полные данные записи если нужно
        let finalNote = note;
        if ((!note.subcategory || !note.category) && note.id) {
          try {
            const noteDetail = await cashflowAPI.getNote(note.id);
            finalNote = noteDetail.data;
            console.log('Full note data loaded:', finalNote);
          } catch (error) {
            console.error('Error loading note details:', error);
          }
        }

        // Сначала устанавливаем данные формы
        const initialFormData = {
          created_date: localDate,
          status: finalNote.status,
          type: finalNote.type,
          category: finalNote.category,
          subcategory: finalNote.subcategory || '',
          amount: finalNote.amount,
          comment: finalNote.comment || ''
        };

        console.log('Setting initial form data:', initialFormData);
        setFormData(initialFormData);

        // Загружаем категории для типа и подкатегории для категории
        if (finalNote.type) {
          await loadCategoriesForType(finalNote.type, finalNote.category);
        }

        setIsInitialized(true);
      } else {
        // Новая запись
        const now = new Date();
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        
        setFormData(prev => ({
          ...prev,
          created_date: localDate
        }));
        setIsInitialized(true);
      }
    };

    initializeForm();
  }, [note]);

  // Функция для загрузки категорий по типу
  const loadCategoriesForType = async (typeId, currentCategory = null) => {
    try {
      const response = await cashflowAPI.getCategoriesByType(typeId);
      const cats = response.data.results || response.data;
      console.log('Loaded categories for type:', cats);
      setFilteredCategories(cats);
      
      // Проверяем что категория существует в загруженных
      if (currentCategory) {
        const catExists = cats.find(cat => cat.id == currentCategory);
        if (!catExists) {
          console.warn('Category not found for type, resetting');
          setFormData(prev => ({ ...prev, category: '', subcategory: '' }));
        } else {
          // Если категория существует, загружаем подкатегории
          await loadSubcategoriesForCategory(currentCategory);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback на локальные данные
      const localCats = categories.filter(cat => cat.type == typeId);
      setFilteredCategories(localCats);
    }
  };

  // Функция для загрузки подкатегорий по категории
  const loadSubcategoriesForCategory = async (categoryId, currentSubcategory = null) => {
    try {
      const response = await cashflowAPI.getSubcategoriesByCategory(categoryId);
      const subs = response.data.results || response.data;
      console.log('Loaded subcategories:', subs);
      setFilteredSubcategories(subs);
      
      // Проверяем что подкатегория существует в загруженных
      if (currentSubcategory) {
        const subExists = subs.find(sub => sub.id == currentSubcategory);
        if (!subExists) {
          console.warn('Subcategory not found in loaded list, resetting');
          setFormData(prev => ({ ...prev, subcategory: '' }));
        }
      }
    } catch (error) {
      console.error('Error loading subcategories:', error);
      // Fallback на локальные данные
      const localSubs = subcategories.filter(sub => sub.category == categoryId);
      setFilteredSubcategories(localSubs);
    }
  };

  // Эффект для изменения типа
  useEffect(() => {
    if (!isInitialized) return;

    const handleTypeChange = async () => {
      if (formData.type) {
        await loadCategoriesForType(formData.type, formData.category);
      } else {
        setFilteredCategories([]);
        setFilteredSubcategories([]);
        setFormData(prev => ({ ...prev, category: '', subcategory: '' }));
      }
    };

    handleTypeChange();
  }, [formData.type, isInitialized]);

  // Эффект для изменения категории
  useEffect(() => {
    if (!isInitialized) return;

    const handleCategoryChange = async () => {
      if (formData.category) {
        await loadSubcategoriesForCategory(formData.category, formData.subcategory);
      } else {
        setFilteredSubcategories([]);
        setFormData(prev => ({ ...prev, subcategory: '' }));
      }
    };

    handleCategoryChange();
  }, [formData.category, isInitialized]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to:`, value);
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      console.log('New form data:', newData);
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Final form data on submit:', formData);
    
    if (!formData.status || !formData.type || !formData.category || !formData.subcategory || !formData.amount) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (note) {
      onSubmit(note.id, submitData);
    } else {
      onSubmit(submitData);
    }
  };

  if (!isInitialized) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="loading">Загрузка формы...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{note ? 'Редактирование записи' : 'Новая запись'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Дата и время *</label>
            <input
              type="datetime-local"
              name="created_date"
              value={formData.created_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Статус *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="">Выберите статус</option>
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Тип операции *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Выберите тип</option>
                {types.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Категория *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={!formData.type}
              >
                <option value="">Выберите категорию</option>
                {filteredCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Подкатегория *</label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                required
                disabled={!formData.category}
              >
                <option value="">Выберите подкатегорию</option>
                {filteredSubcategories.map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Сумма (руб) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Комментарий</label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows="3"
              placeholder="Введите комментарий..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              {note ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteForm;