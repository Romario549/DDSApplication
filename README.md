# DDSApplication
Веб-сервис для управления движением денежных средств (ДДС)\
Полный список команд для запуска

Сервер:
* cd backend
* python -m venv venv
* venv\Scripts\activate
* pip install -r requirements.txt
* python manage.py makemigrations
* python manage.py migrate
* python manage.py load_initial_data
* python manage.py runserver

Клиент:
* cd frontend
* npm i
* npm start
