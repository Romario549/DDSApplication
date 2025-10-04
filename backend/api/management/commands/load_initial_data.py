from django.core.management.base import BaseCommand
from api.models import Status, Type, Category, Subcategory

class Command(BaseCommand):
    help = 'Load initial data for DDS application'
    
    def handle(self, *args, **options):
        statuses = [
            {'name': 'Бизнес', 'description': 'Бизнес операции'},
            {'name': 'Личное', 'description': 'Личные финансы'},
            {'name': 'Налог', 'description': 'Налоговые операции'},
        ]
        
        for status_data in statuses:
            Status.objects.get_or_create(**status_data)

        types = [
            {'name': 'Пополнение', 'description': 'Поступление денежных средств'},
            {'name': 'Списание', 'description': 'Расход денежных средств'},
        ]
        
        type_objects = {}
        for type_data in types:
            type_obj, _ = Type.objects.get_or_create(**type_data)
            type_objects[type_obj.name] = type_obj
        
        categories_data = {
            'Пополнение': [
                {'name': 'Доходы', 'description': 'Источники доходов'},
                {'name': 'Инвестиции', 'description': 'Инвестиционные поступления'},
            ],
            'Списание': [
                {'name': 'Инфраструктура', 'description': 'Расходы на инфраструктуру'},
                {'name': 'Маркетинг', 'description': 'Маркетинговые расходы'},
                {'name': 'Зарплаты', 'description': 'Выплаты сотрудникам'},
            ],
        }
        
        category_objects = {}
        for type_name, categories in categories_data.items():
            transaction_type = type_objects[type_name]
            for category_data in categories:
                category, _ = Category.objects.get_or_create(
                    **category_data,
                    type=transaction_type
                )
                category_objects[f"{type_name}_{category.name}"] = category
                
                if type_name == 'Пополнение':
                    if category.name == 'Доходы':
                        subcategories = ['Продажи', 'Услуги', 'Прочее']
                    else: 
                        subcategories = ['Дивиденды', 'Проценты', 'Рост капитала']
                else:  
                    if category.name == 'Инфраструктура':
                        subcategories = ['VPS', 'Proxy', 'Хостинг', 'Домены']
                    elif category.name == 'Маркетинг':
                        subcategories = ['Farpost', 'Avito', 'Контекстная реклама', 'SMM']
                    else:  
                        subcategories = ['Штатные сотрудники', 'Фрилансеры']
                
                for subcategory_name in subcategories:
                    Subcategory.objects.get_or_create(
                        category=category,
                        name=subcategory_name
                    )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully loaded initial data')
        )