from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    objects = SoftDeleteManager()
    all_objects = models.Manager()
    
    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()
    
    class Meta:
        abstract = True

class Status(SoftDeleteModel):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название статуса")
    description = models.TextField(blank=True, verbose_name="Описание")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Статус"
        verbose_name_plural = "Статусы"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Type(SoftDeleteModel):
    name = models.CharField(max_length=100, unique=True, verbose_name="Тип операции")
    description = models.TextField(blank=True, verbose_name="Описание")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Тип операции"
        verbose_name_plural = "Типы операций"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Category(SoftDeleteModel):
    name = models.CharField(max_length=100, verbose_name="Название категории")
    type = models.ForeignKey(  # Добавляем связь с типом операции
        Type, 
        on_delete=models.CASCADE,
        related_name='categories',
        verbose_name="Тип операции"
    )
    description = models.TextField(blank=True, verbose_name="Описание")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"
        ordering = ['name']
        unique_together = ['name', 'type']  # Уникальность в рамках типа
    
    def __str__(self):
        return f"{self.name} ({self.type.name})"

class Subcategory(SoftDeleteModel):
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='subcategories'
    )
    name = models.CharField(max_length=100, verbose_name="Название подкатегории")
    description = models.TextField(blank=True, verbose_name="Описание")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Подкатегория"
        verbose_name_plural = "Подкатегории"
        ordering = ['name']
        unique_together = ['category', 'name']
    
    def __str__(self):
        return f"{self.category.name} - {self.name}"

class Note(SoftDeleteModel):
    created_date = models.DateTimeField(
        default=timezone.now, 
        verbose_name="Дата создания записи"
    )
    status = models.ForeignKey(
        Status, 
        on_delete=models.PROTECT,
        verbose_name="Статус"
    )
    type = models.ForeignKey(
        Type, 
        on_delete=models.PROTECT,
        verbose_name="Тип операции"
    )
    category = models.ForeignKey(
        Category, 
        on_delete=models.PROTECT,
        verbose_name="Категория"
    )
    subcategory = models.ForeignKey(
        Subcategory, 
        on_delete=models.PROTECT,
        verbose_name="Подкатегория"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        verbose_name="Сумма (руб)"
    )
    comment = models.TextField(blank=True, verbose_name="Комментарий")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Движение денежных средств"
        verbose_name_plural = "Движения денежных средств"
        ordering = ['-created_date']
    
    def __str__(self):
        return f"{self.created_date.strftime('%d.%m.%Y')} - {self.amount} руб."