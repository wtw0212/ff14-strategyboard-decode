from playwright.sync_api import sync_playwright

def verify_app_loads():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Wait for the dev server to be ready (might take a few seconds)
            page.goto("http://localhost:5173", timeout=60000)

            # Wait for the canvas to be present, which indicates the app loaded
            # The canvas is inside a div with specific style or structure
            page.wait_for_selector("canvas", timeout=30000)

            # Take a screenshot
            page.screenshot(path="verification/app_loaded.png")
            print("Screenshot taken successfully")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app_loads()
