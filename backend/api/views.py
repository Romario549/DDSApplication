from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Sum, Count

from .models import Status, Type, Category, Subcategory, Note
from .serializers import (
    StatusSerializer, TypeSerializer, CategorySerializer,
    SubcategorySerializer, NoteSerializer, NoteCreateSerializer
)

class SoftDeleteViewSet(viewsets.ModelViewSet):
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        instance = self.get_object()
        instance.restore()
        return Response(status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def deleted(self, request):
        queryset = self.queryset.filter(is_deleted=True)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class StatusViewSet(SoftDeleteViewSet):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

class TypeViewSet(SoftDeleteViewSet):
    queryset = Type.objects.all()
    serializer_class = TypeSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

class CategoryViewSet(SoftDeleteViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type']  
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

class SubcategoryViewSet(SoftDeleteViewSet):
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

class NoteViewSet(SoftDeleteViewSet):
    queryset = Note.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'type', 'category', 'subcategory']
    search_fields = ['comment']
    ordering_fields = ['created_date', 'amount', 'created_at']
    ordering = ['-created_date']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return NoteCreateSerializer
        return NoteSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Фильтрация по дате
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_date__date__lte=end_date)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Сводная статистика по ДДС"""
        queryset = self.filter_queryset(self.get_queryset())
        
        summary = queryset.aggregate(
            total_income=Sum('amount', filter=Q(type__name='Пополнение')),
            total_expense=Sum('amount', filter=Q(type__name='Списание')),
            total_transactions=Count('id')
        )
        
        summary = {k: (v or 0) for k, v in summary.items()}
        summary['balance'] = summary['total_income'] - summary['total_expense']
        
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def categories_by_type(self, request):
        """Получение категорий по типу операции"""
        type_id = request.query_params.get('type_id')
        if not type_id:
            return Response(
                {'error': 'type_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        categories = Category.objects.filter(type_id=type_id)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def subcategories_by_category(self, request):
        """Получение подкатегорий по категории"""
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response(
                {'error': 'category_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subcategories = Subcategory.objects.filter(category_id=category_id)
        serializer = SubcategorySerializer(subcategories, many=True)
        return Response(serializer.data)