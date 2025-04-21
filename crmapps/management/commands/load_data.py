import json
import os
from django.core.management.base import BaseCommand
from crmapps.models import DataPoint

class Command(BaseCommand):
    help = 'Load JSON data into database'

    def handle(self, *args, **kwargs):
        # Use absolute path to avoid permission issues
        base_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.abspath(os.path.join(base_dir, '../../../datafile.json'))

        with open(json_path, encoding='utf-8') as f:
            data = json.load(f)
            for item in data:
                DataPoint.objects.create(
                    end_year = item.get("end_year"),
                    intensity = item.get("intensity") or 0,
                    sector = item.get("sector"),
                    topic = item.get("topic"),
                    insight = item.get("insight"),
                    url = item.get("url"),
                    region = item.get("region"),
                    start_year = item.get("start_year"),
                    impact = item.get("impact"),
                    added = item.get("added"),
                    published = item.get("published"),
                    country = item.get("country"),
                    relevance = item.get("relevance") or 0,
                    pestle = item.get("pestle"),
                    source = item.get("source"),
                    title = item.get("title"),
                    likelihood = item.get("likelihood") or 0
                )

        self.stdout.write(self.style.SUCCESS('✔ JSON data loaded successfully!'))
