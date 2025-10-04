from rest_framework import serializers
from .models import Status, Type, Category, Subcategory, Note

class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = '__all__'

class TypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Type
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source='type.name', read_only=True)
    
    class Meta:
        model = Category
        fields = '__all__'

class SubcategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    type_name = serializers.CharField(source='category.type.name', read_only=True)
    
    class Meta:
        model = Subcategory
        fields = '__all__'

class NoteSerializer(serializers.ModelSerializer):
    status_name = serializers.CharField(source='status.name', read_only=True)
    type_name = serializers.CharField(source='type.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)
    formatted_amount = serializers.SerializerMethodField()
    formatted_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = '__all__'
    
    def get_formatted_amount(self, obj):
        return f"{obj.amount:,.2f}".replace(',', ' ').replace('.', ',')
    
    def get_formatted_date(self, obj):
        return obj.created_date.strftime('%d.%m.%Y %H:%M')
    
    def validate(self, data):
        if 'category' in data and 'type' in data:
            if data['category'].type != data['type']:
                raise serializers.ValidationError({
                    'category': 'Выбранная категория не принадлежит выбранному типу операции'
                })
        
        if 'subcategory' in data and 'category' in data:
            if data['subcategory'].category != data['category']:
                raise serializers.ValidationError({
                    'subcategory': 'Выбранная подкатегория не принадлежит выбранной категории'
                })
        
        return data

class NoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = [
            'created_date', 'status', 'type', 
            'category', 'subcategory', 'amount', 'comment'
        ]
    
    def validate(self, data):
        return NoteSerializer.validate(self, data)