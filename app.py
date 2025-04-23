# Import necessary libraries
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from typing import Optional

# Define request models
class RepoRequest(BaseModel):
    url: str
    frequency: Optional[str] = Field(default="week", description="Frequency for commit data (day, week, month)")

# Endpoint: Code frequency stats
@app.post("/api/code_frequency")
async def get_code_frequency(request: RepoRequest):
    owner, repo = parse_github_url(str(request.url))
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/stats/code_frequency", headers=HEADERS)
            
            # Special handling for 202 (processing)
            if resp.status_code == 202:
                return {"message": "GitHub is generating the statistics. Please try again in a moment."}
            
            # Handle other errors gracefully
            if resp.status_code != 200:
                print(f"Error from GitHub API: {resp.status_code} - {resp.text}")
                return []
            
            stats = resp.json()
            if not stats:
                return []
                
            result = []
            for week in stats:
                dt = datetime.utcfromtimestamp(week[0]).strftime('%Y-%m-%d')
                result.append({"Date": dt, "Code Additions": week[1], "Code Deletions": week[2]})
            return result
            
    except Exception as e:
        print(f"Exception in code_frequency: {str(e)}")
        return []  # Return empty list instead of raising exception 

# Helper function to format dates consistently
def format_date(date_obj_or_str):
    """Format a date object or string to a consistent YYYY-MM-DD format"""
    try:
        # If it's already a datetime object
        if isinstance(date_obj_or_str, datetime):
            return date_obj_or_str.strftime('%Y-%m-%d')
        
        # If it's a timestamp (integer)
        if isinstance(date_obj_or_str, int):
            return datetime.utcfromtimestamp(date_obj_or_str).strftime('%Y-%m-%d')
            
        # If it's a string, try to parse it
        if isinstance(date_obj_or_str, str):
            # Try to parse various formats
            for fmt in ['%Y-%m-%d', '%Y-%m', '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y']:
                try:
                    return datetime.strptime(date_obj_or_str, fmt).strftime('%Y-%m-%d')
                except ValueError:
                    continue
        
        # If we can't parse it, return as is
        return str(date_obj_or_str)
    except Exception as e:
        print(f"Error formatting date {date_obj_or_str}: {str(e)}")
        return str(date_obj_or_str)

# Endpoint: Pull request counts
@app.post("/api/pull_requests")
async def get_pull_requests(request: RepoRequest):
    try:
        owner, repo = parse_github_url(str(request.url))
        open_prs = await fetch_all_prs(owner, repo, "open")
        closed_prs = await fetch_all_prs(owner, repo, "closed")
        merged = sum(1 for pr in closed_prs if pr.get("merged_at"))
        closed_unmerged = len(closed_prs) - merged
        return {"open": len(open_prs), "closed_unmerged": closed_unmerged, "merged": merged}
    except Exception as e:
        print(f"Exception in pull_requests: {str(e)}")
        return {"open": 0, "closed_unmerged": 0, "merged": 0} 

# Endpoint: Commit frequency
@app.post("/api/commits")
async def get_commits(request: RepoRequest):
    try:
        owner, repo = parse_github_url(str(request.url))
        frequency = request.frequency if hasattr(request, 'frequency') else "week"
        
        # Determine the appropriate GitHub API endpoint based on frequency
        api_endpoint = f"{GITHUB_API}/repos/{owner}/{repo}/stats/commit_activity"
        
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(api_endpoint, headers=HEADERS)
            
            # Special handling for 202 (processing)
            if resp.status_code == 202:
                return {"message": "GitHub is generating the statistics. Please try again in a moment."}
            
            # Handle other errors gracefully
            if resp.status_code != 200:
                print(f"Error from GitHub API: {resp.status_code} - {resp.text}")
                return {"commit_frequency": {}}
            
            stats = resp.json()
            if not stats:
                return {"commit_frequency": {}}
            
            # Process the data based on the requested frequency
            commit_frequency = {}
            
            # GitHub returns weekly commit data by default
            if frequency == "week":
                # Each item has a 'week' timestamp and 'total' commits
                for item in stats:
                    date_str = format_date(item['week'])
                    commit_frequency[date_str] = item['total']
            
            elif frequency == "day":
                # For daily data, process the days array in each week
                for item in stats:
                    week_start = datetime.utcfromtimestamp(item['week'])
                    for day_index, commit_count in enumerate(item['days']):
                        if commit_count > 0:  # Only include days with commits
                            day_date = week_start + timedelta(days=day_index)
                            date_str = format_date(day_date)
                            commit_frequency[date_str] = commit_count
            
            elif frequency == "month":
                # Aggregate weekly data into months
                month_totals = {}
                for item in stats:
                    date = datetime.utcfromtimestamp(item['week'])
                    month_key = f"{date.year}-{date.month:02d}"
                    if month_key not in month_totals:
                        month_totals[month_key] = 0
                    month_totals[month_key] += item['total']
                
                # Convert to properly formatted dates
                for month_key, total in month_totals.items():
                    year, month = month_key.split('-')
                    # Create a date object for the first day of the month
                    date_obj = datetime(int(year), int(month), 1)
                    date_str = format_date(date_obj)
                    commit_frequency[date_str] = total
            
            return {"commit_frequency": commit_frequency}
                
    except Exception as e:
        print(f"Exception in commits: {str(e)}")
        return {"commit_frequency": {}} 