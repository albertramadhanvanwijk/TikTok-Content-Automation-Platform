const fs=require('fs');
const p='apps/frontend/src/app/(dashboard)/content/[id]/page.tsx';
let s=fs.readFileSync(p,'utf8');
const needle='    // Persist new order to backend\n    try {\n      for (const slide of updatedSlides) {\n        await updateSlide(slide.id, { slide_number: slide.slide_number });\n      }\n      toast.success(\'Order updated\', \'Slide positions saved\');\n    } catch (err: any) {\n      toast.error(\'Reorder failed\', \'Could not save new order\');\n      // Revert on failure\n      setSlides(slides);\n    }';
const repl='    // Persist new order atomically (avoids UNIQUE constraint collisions)\n    try {\n      const { reorderSlides } = useContentStore.getState();\n      // use store directly to avoid closure stale updateSlide loop\n      await reorderSlides(carouselId, updatedSlides.map((s) => s.id));\n      toast.success(\'Order updated\', \'Slide positions saved\');\n    } catch (err: any) {\n      toast.error(\'Reorder failed\', err.message || \'Could not save new order\');\n      setSlides(slides);\n    }';
if(s.includes(needle)){
  s=s.replace(needle,repl);
  fs.writeFileSync(p,s,'utf8');
  console.log('patched handleDragEnd OK');
}else{
  console.log('needle not found');
  const i=s.indexOf('Persist new order');
  console.log(JSON.stringify(s.slice(i-80,i+700)));
}
