from django.shortcuts import render
from rest_framework import generics
from .models import DataPoint
from .serializers import DataPointSerializer


from django.http import JsonResponse
  # Replace with actual model
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
import json
from django.db.models import Avg, Count

def dashboard(request):
    """Render the dashboard page"""
    return render(request, 'dashboard.html')

def get_datapoints(request):
    """API endpoint to get all data points"""
    datapoints = DataPoint.objects.all()
    
    # Apply filters if provided in query parameters
    filters = {
        'end_year': request.GET.get('end_year'),
        'topic': request.GET.get('topic'),
        'sector': request.GET.get('sector'),
        'region': request.GET.get('region'),
        'pestle': request.GET.get('pestle'),
        'source': request.GET.get('source'),
        'country': request.GET.get('country'),
        'impact': request.GET.get('impact'),
    }
    for key, value in filters.items():
        if value:
            datapoints = datapoints.filter(**{key: value})
    
    # Convert to list of dictionaries for JSON response
    data = list(datapoints.values())
    return JsonResponse(data, safe=False)

def get_dashboard_summary(request):
    """API endpoint to get summary statistics for dashboard"""
    # Count total data points
    total_datapoints = DataPoint.objects.count()
    
    # Calculate averages
    avg_intensity = DataPoint.objects.aggregate(avg=Avg('intensity'))['avg'] or 0
    avg_likelihood = DataPoint.objects.aggregate(avg=Avg('likelihood'))['avg'] or 0
    avg_relevance = DataPoint.objects.aggregate(avg=Avg('relevance'))['avg'] or 0
    
    # Get unique values for filters
    end_years = DataPoint.objects.exclude(end_year__isnull=True).exclude(end_year='').values_list('end_year', flat=True).distinct().order_by('end_year')
    topics = DataPoint.objects.exclude(topic__isnull=True).exclude(topic='').values_list('topic', flat=True).distinct().order_by('topic')
    sectors = DataPoint.objects.exclude(sector__isnull=True).exclude(sector='').values_list('sector', flat=True).distinct().order_by('sector')
    regions = DataPoint.objects.exclude(region__isnull=True).exclude(region='').values_list('region', flat=True).distinct().order_by('region')
    pestles = DataPoint.objects.exclude(pestle__isnull=True).exclude(pestle='').values_list('pestle', flat=True).distinct().order_by('pestle')
    sources = DataPoint.objects.exclude(source__isnull=True).exclude(source='').values_list('source', flat=True).distinct().order_by('source')
    countries = DataPoint.objects.exclude(country__isnull=True).exclude(country='').values_list('country', flat=True).distinct().order_by('country')
    impacts = DataPoint.objects.exclude(impact__isnull=True).exclude(impact='').values_list('impact', flat=True).distinct().order_by('impact')
    
    # Return summarized data
    return JsonResponse({
        'total_datapoints': total_datapoints,
        'avg_intensity': round(avg_intensity, 2),
        'avg_likelihood': round(avg_likelihood, 2),
        'avg_relevance': round(avg_relevance, 2),
        'filters': {
            'end_years': list(end_years),
            'topics': list(topics),
            'sectors': list(sectors),
            'regions': list(regions),
            'pestles': list(pestles),
            'sources': list(sources),
            'countries': list(countries),
            'impacts': list(impacts)
        }
    })

def get_intensity_trend(request):
    """API endpoint to get intensity trend over time"""
    # Group by year and calculate average intensity
    year_intensity = DataPoint.objects.exclude(start_year__isnull=True).exclude(start_year='').values('start_year').annotate(
        avg_intensity=Avg('intensity')
    ).order_by('start_year')
    
    return JsonResponse(list(year_intensity), safe=False)

def get_topics_distribution(request):
    """API endpoint to get topics distribution"""
    # Count data points by topic
    topic_counts = DataPoint.objects.exclude(topic__isnull=True).exclude(topic='').values('topic').annotate(
        count=Count('id')
    ).order_by('-count')[:10]  # Top 10 topics
    
    return JsonResponse(list(topic_counts), safe=False)

def get_sector_analysis(request):
    """API endpoint to get sector analysis"""
    # Get count and average intensity by sector
    sector_data = DataPoint.objects.exclude(sector__isnull=True).exclude(sector='').values('sector').annotate(
        count=Count('id'),
        avg_intensity=Avg('intensity')
    ).order_by('-count')
    
    return JsonResponse(list(sector_data), safe=False)

def get_region_comparison(request):
    """API endpoint to get region comparison data"""
    # Get metrics by region
    region_data = DataPoint.objects.exclude(region__isnull=True).exclude(region='').values('region').annotate(
        count=Count('id'),
        avg_intensity=Avg('intensity'),
        avg_likelihood=Avg('likelihood'),
        avg_relevance=Avg('relevance')
    ).order_by('-count')
    
    return JsonResponse(list(region_data), safe=False)

def get_pestle_analysis(request):
    """API endpoint to get PESTLE analysis data"""
    # Get metrics by PESTLE category
    pestle_data = DataPoint.objects.exclude(pestle__isnull=True).exclude(pestle='').values('pestle').annotate(
        count=Count('id'),
        avg_intensity=Avg('intensity'),
        avg_likelihood=Avg('likelihood'),
        avg_relevance=Avg('relevance')
    ).order_by('pestle')
    
    return JsonResponse(list(pestle_data), safe=False)

def get_country_insights(request):
    """API endpoint to get country insights"""
    # Get metrics by country
    country_data = DataPoint.objects.exclude(country__isnull=True).exclude(country='').values('country').annotate(
        count=Count('id'),
        avg_intensity=Avg('intensity'),
        avg_likelihood=Avg('likelihood'),
        avg_relevance=Avg('relevance')
    ).order_by('-count')[:15]  # Top 15 countries
    
    return JsonResponse(list(country_data), safe=False)

@csrf_exempt
def filtered_data(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        filters = Q()

        # Example filters — match your actual model fields
        if data.get("country"):
            filters &= Q(country__iexact=data["country"])
        if data.get("end_year"):
            filters &= Q(end_year=data["end_year"])
        if data.get("topic"):
            filters &= Q(topic__icontains=data["topic"])

        queryset = DataPoint.objects.filter(filters)
        results = list(queryset.values())  # You can serialize as needed

        return JsonResponse({"data": results}, safe=False)


class DataPointListAPIView(generics.ListAPIView):
    queryset = DataPoint.objects.all()
    serializer_class = DataPointSerializer

def dashboard_view(request):
    return render(request, 'dashboard.html')
