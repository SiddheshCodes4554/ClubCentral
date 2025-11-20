import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Click on the 'Sign Up' link to navigate to the signup page.
        frame = context.pages[-1]
        # Click on the 'Sign Up' link to go to the signup page.
        elem = frame.locator('xpath=html/body/div/div/footer/div/div/div[3]/ul/li[2]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Institution Mode Required').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Club creation is now part of the enterprise Institution Mode. Students can no longer create clubs directly—your institution administrator will onboard you.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Verified Institutions Only').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Clubs are provisioned by Institution Admins to maintain official oversight.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Multi-Club Command Center').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Manage presidents, finance, and events across every club from a single dashboard.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Premium Analytics').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Institution dashboards deliver performance scoring, heatmaps, finance insights, and more.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=How to get started').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=1. Share this page with your Institution Admin or Student Affairs office.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2. They’ll complete the Institution Onboarding and receive the admin console.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=3. Presidents are invited directly by the Institution Admin with a secure login link.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=4. Students can then apply using the official club invite code shared by leadership.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Institution ready to launch?').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Begin Institution Onboarding').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    