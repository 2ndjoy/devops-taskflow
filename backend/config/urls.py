
from django.contrib import admin
from django.urls import path
from tasks.views import TaskListCreateView, TaskDetailView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/tasks/", TaskListCreateView.as_view(), name="task-list-create"),
    path("api/tasks/<int:pk>/", TaskDetailView.as_view(), name="task-detail"),]
