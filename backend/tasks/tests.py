
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Task


class TaskAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("task-list-create")

    def test_list_tasks_returns_200(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_task_returns_201(self):
        payload = {
            "title": "Learn automated testing",
            "description": "Write tests for the TaskFlow API",
        }

        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(
            Task.objects.get().title,
            "Learn automated testing",
        )

    def test_create_task_without_title_returns_400(self):
        payload = {
            "title": "",
            "description": "This request should fail",
        }

        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Task.objects.count(), 0)

    def test_update_task(self):
        task = Task.objects.create(
            title="Old title",
            description="Old description",
        )
        detail_url = reverse("task-detail", args=[task.id])

        payload = {
            "title": "Updated title",
            "description": "Updated description",
        }

        response = self.client.patch(
            detail_url,
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        task.refresh_from_db()
        self.assertEqual(task.title, "Updated title")
        self.assertEqual(task.description, "Updated description")

    def test_delete_task(self):
        task = Task.objects.create(title="Task to delete")
        detail_url = reverse("task-detail", args=[task.id])

        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task.id).exists())
